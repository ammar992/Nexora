import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { ApiError } from "@/server/http";

let configured = false;

export function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function client() {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, "Image uploads are not configured. Set the CLOUDINARY_* variables.");
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export const UPLOAD_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
};

const folderRoot = () => process.env.CLOUDINARY_FOLDER || "nexora";

/** Checks magic bytes so a renamed non-image can't slip through on its Content-Type alone. */
function looksLikeImage(buf: Buffer) {
  const hex = buf.subarray(0, 12).toString("hex");
  return (
    hex.startsWith("ffd8ff") || // jpeg
    hex.startsWith("89504e47") || // png
    hex.startsWith("47494638") || // gif
    (hex.startsWith("52494646") && buf.subarray(8, 12).toString() === "WEBP") ||
    buf.subarray(4, 12).toString().startsWith("ftypavif")
  );
}

export async function uploadImageBuffer(buf: Buffer, subfolder: string): Promise<{ url: string; publicId: string; width: number; height: number }> {
  if (buf.byteLength > UPLOAD_LIMITS.maxBytes) throw new ApiError(413, "Images must be 5 MB or smaller.");
  if (!looksLikeImage(buf)) throw new ApiError(415, "That file doesn't look like a supported image.");
  const c = client();
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = c.uploader.upload_stream(
      {
        folder: `${folderRoot()}/${subfolder}`,
        resource_type: "image",
        overwrite: false,
        transformation: [{ width: 2000, height: 2000, crop: "limit", quality: "auto", fetch_format: "auto" }],
      },
      (err, res) => (err || !res ? reject(err ?? new Error("Upload failed")) : resolve(res))
    );
    stream.end(buf);
  });
  return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height };
}

/** Used by the demo seed: lets Cloudinary fetch a remote image directly. */
export async function uploadImageFromUrl(url: string, subfolder: string) {
  const res = await client().uploader.upload(url, {
    folder: `${folderRoot()}/${subfolder}`,
    resource_type: "image",
    transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }],
  });
  return { url: res.secure_url, publicId: res.public_id };
}

export async function deleteImage(publicId: string) {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await client().uploader.destroy(publicId);
  } catch (err) {
    console.warn("[cloudinary] delete failed", publicId, err);
  }
}
