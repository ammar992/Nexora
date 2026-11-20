import { route, ok, ApiError } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { uploadImageBuffer, UPLOAD_LIMITS } from "@/server/cloudinary";
import { rateLimit } from "@/server/rateLimit";

const FOLDERS = ["avatars", "listings", "vendors", "branding", "categories"] as const;

export const POST = route(async (req) => {
  const user = await requireUser();
  await rateLimit("upload", user.id, 40, 60 * 10);
  const form = await req.formData().catch(() => null);
  if (!form) throw new ApiError(400, "Send the image as multipart/form-data.");
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "listings");
  if (!FOLDERS.includes(folder as (typeof FOLDERS)[number])) throw new ApiError(400, "Unknown upload folder.");
  if ((folder === "branding" || folder === "categories") && user.role !== "admin") throw new ApiError(403, "Only admins can upload branding.");
  if (!(file instanceof File)) throw new ApiError(400, "Choose an image to upload.");
  if (!UPLOAD_LIMITS.types.includes(file.type)) throw new ApiError(415, "Use a JPG, PNG, WebP, AVIF or GIF image.");
  if (file.size > UPLOAD_LIMITS.maxBytes) throw new ApiError(413, "Images must be 5 MB or smaller.");
  const buf = Buffer.from(await file.arrayBuffer());
  const result = await uploadImageBuffer(buf, folder);
  return ok(result, { status: 201 });
});
