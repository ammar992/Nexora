import { route, parseBody, ok, ApiError, assertObjectId } from "@/server/http";
import { vendorDecisionSchema } from "@/formik/schema/admin";
import { requireUser } from "@/server/auth/session";
import { VendorProfile } from "@/server/models/VendorProfile";
import { User } from "@/server/models/User";
import { Listing } from "@/server/models/Listing";
import { notify } from "@/server/services/notifications";
import { emails } from "@/server/email/templates";
import { getSettings } from "@/server/services/settings";

const SUSPENDED_NOTE = "Vendor suspended";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  await requireUser(["admin"]);
  const { id } = await params;
  assertObjectId(id, "vendor");
  const body = await parseBody(req, vendorDecisionSchema);
  const vendor = await VendorProfile.findById(id);
  if (!vendor) throw new ApiError(404, "Vendor not found.");
  const previous = vendor.status;
  if (body.featured !== undefined) vendor.featured = body.featured;
  vendor.status = body.status as typeof vendor.status;
  if (body.status === "rejected" || body.status === "suspended") vendor.rejectionReason = body.reason;
  if (body.status === "approved") {
    vendor.rejectionReason = "";
    vendor.approvedAt = vendor.approvedAt ?? new Date();
  }
  await vendor.save();

  const user = await User.findById(vendor.user);
  if (user && user.role !== "admin") {
    if (body.status === "approved" && user.role !== "vendor") user.role = "vendor";
    if (body.status === "rejected" && user.role === "vendor") user.role = "customer";
    await user.save();
  }
  // Suspension hides the vendor's live listings; reinstating restores exactly those.
  if (body.status === "suspended" && previous !== "suspended") {
    await Listing.updateMany({ vendor: vendor._id, status: "approved" }, { $set: { status: "pending", rejectionReason: SUSPENDED_NOTE } });
  }
  if (body.status === "approved" && previous === "suspended") {
    await Listing.updateMany({ vendor: vendor._id, status: "pending", rejectionReason: SUSPENDED_NOTE }, { $set: { status: "approved", rejectionReason: "" } });
  }

  if (user && previous !== body.status && (body.status === "approved" || body.status === "rejected")) {
    const settings = await getSettings();
    await notify(user._id, {
      type: "vendor",
      title: body.status === "approved" ? "Your vendor account is approved" : "Update on your vendor application",
      body: body.reason,
      link: body.status === "approved" ? "/vendor" : "/become-vendor",
      email: { ...emails.vendorApplication(settings.siteName, user.name, body.status, body.reason || undefined), force: true },
    });
  } else if (user && body.status === "suspended" && previous !== "suspended") {
    await notify(user._id, { type: "vendor", title: "Your store has been suspended", body: body.reason, link: "/vendor" });
  }
  return ok({ status: vendor.status, featured: vendor.featured });
});
