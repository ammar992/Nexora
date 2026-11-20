import { route, parseBody, ok } from "@/server/http";
import { profileSchema } from "@/formik/schema/account";
import { requireUser } from "@/server/auth/session";
import { User } from "@/server/models/User";

export const PATCH = route(async (req) => {
  const session = await requireUser();
  const body = await parseBody(req, profileSchema);
  const user = await User.findByIdAndUpdate(
    session.id,
    { $set: { name: body.name, phone: body.phone, bio: body.bio, avatar: body.avatar, address: body.address } },
    { returnDocument: "after", runValidators: true }
  )
    .select("name email phone bio avatar address")
    .lean();
  return ok({ user });
});
