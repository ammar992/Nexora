import { route, parseBody, ok, ApiError, assertObjectId } from "@/server/http";
import { inquirySchema } from "@/formik/schema/account";
import { requireUser } from "@/server/auth/session";
import { Listing } from "@/server/models/Listing";
import { VendorProfile } from "@/server/models/VendorProfile";
import { rateLimit } from "@/server/rateLimit";
import { notify } from "@/server/services/notifications";
import { emails } from "@/server/email/templates";
import { getSettings } from "@/server/services/settings";

/** Sends a customer question to the vendor (in-app + email with reply-to set to the customer). */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser();
  await rateLimit("inquiry", user.id, 6, 60 * 60);
  const { id } = await params;
  assertObjectId(id, "listing");
  const { message } = await parseBody(req, inquirySchema);
  const listing = await Listing.findOne({ _id: id, status: "approved" }).select("title slug vendor").lean();
  if (!listing) throw new ApiError(404, "That listing isn't available.");
  const vendor = await VendorProfile.findById(listing.vendor).select("user").lean();
  if (!vendor) throw new ApiError(404, "Vendor not found.");
  if (vendor.user.toString() === user.id) throw new ApiError(400, "This is your own listing.");
  const settings = await getSettings();
  await notify(vendor.user, {
    type: "message",
    title: `${user.name} asked about ${listing.title}`,
    body: message.slice(0, 280),
    link: `/listing/${listing.slug}`,
    email: { ...emails.vendorInquiry(settings.siteName, { fromName: user.name, fromEmail: user.email, listingTitle: listing.title, message }), replyTo: user.email, force: true },
  });
  return ok({ sent: true });
});
