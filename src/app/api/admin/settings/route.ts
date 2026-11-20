import { route, parseBody, ok } from "@/server/http";
import { settingsSchema } from "@/formik/schema/admin";
import { requireUser } from "@/server/auth/session";
import { PlatformSettings } from "@/server/models/PlatformSettings";
import { revalidatePath } from "next/cache";

export const PUT = route(async (req) => {
  await requireUser(["admin"]);
  const body = await parseBody(req, settingsSchema);
  const settings = await PlatformSettings.findOneAndUpdate({ key: "global" }, { $set: body }, { upsert: true, returnDocument: "after", runValidators: true }).lean();
  revalidatePath("/", "layout");
  return ok({ settings });
});
