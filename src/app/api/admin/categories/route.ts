import { route, parseBody, ok } from "@/server/http";
import { categorySchema } from "@/formik/schema/listing";
import { requireUser } from "@/server/auth/session";
import { Category } from "@/server/models/Category";
import { uniqueSlug } from "@/server/services/slugs";

export const POST = route(async (req) => {
  await requireUser(["admin"]);
  const body = await parseBody(req, categorySchema);
  const category = await Category.create({ ...body, slug: await uniqueSlug(Category, body.name) });
  return ok({ id: category._id.toString(), slug: category.slug }, { status: 201 });
});
