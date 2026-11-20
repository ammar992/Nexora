import { route, parseBody, ok, ApiError } from "@/server/http";
import { vendorApplicationSchema } from "@/formik/schema/account";
import { requireUser } from "@/server/auth/session";
import { VendorProfile } from "@/server/models/VendorProfile";
import { User } from "@/server/models/User";
import { uniqueSlug } from "@/server/services/slugs";
import { getSettings } from "@/server/services/settings";
import { notify, notifyAdmins } from "@/server/services/notifications";
import { emails } from "@/server/email/templates";
import { rateLimit } from "@/server/rateLimit";

export const POST = route(async (req) => {
  const user = await requireUser();
  await rateLimit("vendor-apply", user.id, 5, 60 * 60);
  const body = await parseBody(req, vendorApplicationSchema);
  const existing = await VendorProfile.findOne({ user: user.id });
  if (existing && existing.status !== "rejected") {
    throw new ApiError(409, existing.status === "approved" ? "You already have a vendor account." : "Your application is already being reviewed.");
  }
  const settings = await getSettings();
  const status: "approved" | "pending" = settings.autoApproveVendors ? "approved" : "pending";
  const fields = {
    storeName: body.storeName,
    tagline: body.tagline,
    description: body.description,
    location: { city: body.city, country: body.country },
    contactEmail: body.contactEmail,
    contactPhone: body.contactPhone,
    website: body.website,
    status,
    rejectionReason: "",
    ...(status === "approved" ? { approvedAt: new Date() } : {}),
  };
  const profile = existing
    ? await VendorProfile.findByIdAndUpdate(existing._id, { $set: fields }, { returnDocument: "after" })
    : await VendorProfile.create({ user: user.id, slug: await uniqueSlug(VendorProfile, body.storeName), ...fields });

  if (status === "approved" && user.role === "customer") await User.updateOne({ _id: user.id }, { $set: { role: "vendor" } });
  await notify(user.id, {
    type: "vendor",
    title: status === "approved" ? "Your store is live" : "Vendor application received",
    link: status === "approved" ? "/vendor" : "/become-vendor",
    email: { ...emails.vendorApplication(settings.siteName, user.name, status), force: true },
  });
  if (status === "pending") await notifyAdmins({ type: "vendor", title: `New vendor application: ${body.storeName}`, link: "/admin/vendors?status=pending" });
  return ok({ status, slug: profile?.slug }, { status: 201 });
});
