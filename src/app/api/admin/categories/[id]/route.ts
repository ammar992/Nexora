import { route, parseBody, ok, ApiError, assertObjectId } from "@/server/http";
import { categorySchema } from "@/formik/schema/listing";
import { requireUser } from "@/server/auth/session";
import { Category } from "@/server/models/Category";
import { Listing } from "@/server/models/Listing";

export const PUT = route<{ id: string }>(async (req, { params }) => {
  await requireUser(["admin"]);
  const { id } = await params;
  assertObjectId(id, "category");
  const body = await parseBody(req, categorySchema);
  const category = await Category.findByIdAndUpdate(id, { $set: body }, { returnDocument: "after", runValidators: true }).lean();
  if (!category) throw new ApiError(404, "Category not found.");
  return ok({ id: category._id.toString() });
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  await requireUser(["admin"]);
  const { id } = await params;
  assertObjectId(id, "category");
  const inUse = await Listing.countDocuments({ category: id });
  if (inUse > 0) {
    throw new ApiError(409, `${inUse} listing${inUse === 1 ? " uses" : "s use"} this category. Move them or deactivate the category instead.`);
  }
  await Category.deleteOne({ _id: id });
  return ok({ deleted: true });
});
