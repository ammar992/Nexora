import { route, parseBody, ok } from "@/server/http";
import { preferencesSchema } from "@/formik/schema/account";
import { requireUser } from "@/server/auth/session";
import { User } from "@/server/models/User";

export const PATCH = route(async (req) => {
  const session = await requireUser();
  const prefs = await parseBody(req, preferencesSchema);
  await User.updateOne({ _id: session.id }, { $set: { preferences: prefs } });
  return ok({ preferences: prefs });
});
