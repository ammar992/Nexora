import { route, parseBody, ok } from "@/server/http";
import { vendorProfileSchema } from "@/formik/schema/account";
import { requireVendor } from "@/server/auth/session";
import { VendorProfile } from "@/server/models/VendorProfile";

export const PATCH = route(async (req) => {
  const user = await requireVendor();
  const b = await parseBody(req, vendorProfileSchema);
  const profile = await VendorProfile.findByIdAndUpdate(
    user.vendorId,
    {
      $set: {
        storeName: b.storeName,
        tagline: b.tagline,
        description: b.description,
        location: { city: b.city, country: b.country },
        contactEmail: b.contactEmail,
        contactPhone: b.contactPhone,
        website: b.website,
        logo: b.logo,
        coverImage: b.coverImage,
        payoutDetails: { accountName: b.payoutAccountName, bankName: b.payoutBankName, accountNumberLast4: b.payoutAccountLast4 },
      },
    },
    { returnDocument: "after", runValidators: true }
  ).lean();
  return ok({ profile });
});
