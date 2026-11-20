import "server-only";
import { slugify } from "@/resources/utils/format";

type SluggedModel = { exists(filter: Record<string, unknown>): PromiseLike<unknown> };

/** Returns a slug unique within the given model, appending a short suffix on collision. */
export async function uniqueSlug(model: SluggedModel, base: string, excludeId?: string) {
  const root = slugify(base) || "item";
  let candidate = root;
  for (let i = 0; i < 6; i++) {
    const clash = await model.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return candidate;
    candidate = `${root}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}
