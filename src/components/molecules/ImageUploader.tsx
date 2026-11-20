"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { ImagePlus, X, GripVertical, Star } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/interceptor/api";
import { cn } from "@/resources/utils/cn";

export type UploadedImage = { url: string; publicId: string; alt: string };

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const MAX = 5 * 1024 * 1024;

/**
 * Multi-image uploader backed by Cloudinary. Drag to reorder; the first image is the cover.
 */
export function ImageUploader({ value, onChange, folder = "listings", max = 8, error }: { value: UploadedImage[]; onChange: (v: UploadedImage[]) => void; folder?: string; max?: number; error?: string | false }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<{ id: string; name: string; pct: number }[]>([]);
  const [drag, setDrag] = useState(false);
  // Uploads finish asynchronously; keep the latest list in a ref so concurrent uploads append correctly.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  async function handle(files: FileList | File[]) {
    const list = Array.from(files).slice(0, Math.max(0, max - value.length));
    if (!list.length) {
      toast.error(`You can add up to ${max} photos.`);
      return;
    }
    for (const file of list) {
      if (!ACCEPT.split(",").includes(file.type)) {
        toast.error(`${file.name}: use JPG, PNG, WebP, AVIF or GIF.`);
        continue;
      }
      if (file.size > MAX) {
        toast.error(`${file.name} is larger than 5 MB.`);
        continue;
      }
      const id = crypto.randomUUID();
      setUploads((u) => [...u, { id, name: file.name, pct: 0 }]);
      try {
        const res = await api.upload(file, folder, (pct) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, pct } : x))));
        latest.current = [...latest.current, { url: res.url, publicId: res.publicId, alt: "" }];
        onChange(latest.current);
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setUploads((u) => u.filter((x) => x.id !== id));
      }
    }
  }

  return (
    <div>
      <Reorder.Group axis="x" values={value} onReorder={onChange} className="flex flex-wrap gap-3">
        <AnimatePresence initial={false}>
          {value.map((img, i) => (
            <Reorder.Item
              key={img.url}
              value={img}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileDrag={{ scale: 1.05, zIndex: 10 }}
              className="group relative size-28 cursor-grab overflow-hidden rounded-2xl border border-line bg-surface-2 active:cursor-grabbing sm:size-32"
            >
              <Image src={img.url} alt={img.alt || `Photo ${i + 1}`} fill sizes="128px" className="pointer-events-none object-cover" />
              {i === 0 && (
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-bg uppercase">
                  <Star className="size-2.5" fill="currentColor" /> Cover
                </span>
              )}
              <span className="absolute top-2 left-2 rounded-full bg-black/40 p-1 text-white opacity-0 transition group-hover:opacity-100">
                <GripVertical className="size-3" />
              </span>
              <button type="button" onClick={() => onChange(value.filter((v) => v.url !== img.url))} className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-black/55 text-white transition hover:bg-danger" aria-label={`Remove photo ${i + 1}`}>
                <X className="size-3.5" />
              </button>
            </Reorder.Item>
          ))}
        </AnimatePresence>
        {uploads.map((u) => (
          <div key={u.id} className="relative grid size-28 place-items-center overflow-hidden rounded-2xl border border-line bg-surface-2 sm:size-32">
            <div className="skeleton absolute inset-0 rounded-none" />
            <div className="relative text-center">
              <p className="font-display text-xl text-ink">{u.pct}%</p>
              <p className="max-w-24 truncate text-[11px] text-muted">{u.name}</p>
            </div>
            <motion.span className="absolute bottom-0 left-0 h-1 bg-accent" animate={{ width: `${u.pct}%` }} />
          </div>
        ))}
        {value.length + uploads.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handle(e.dataTransfer.files);
            }}
            className={cn(
              "flex size-28 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed text-muted transition sm:size-32",
              drag ? "border-accent bg-accent-soft text-accent" : error ? "border-danger" : "border-line-strong hover:border-accent hover:text-accent"
            )}
          >
            <ImagePlus className="size-6" />
            <span className="text-xs font-semibold">Add photos</span>
          </button>
        )}
      </Reorder.Group>
      <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => e.target.files && handle(e.target.files).finally(() => (e.target.value = ""))} />
      <p className="mt-2 text-[13px] text-muted">Up to {max} photos, 5 MB each. Drag to reorder; the first photo is the cover.</p>
      {error && <p className="pt-1 text-[13px] font-medium text-danger">{error}</p>}
    </div>
  );
}

/** Single-image variant for avatars, logos and covers. */
export function SingleImageUpload({ value, onChange, folder, label, shape = "circle" }: { value: string; onChange: (url: string) => void; folder: string; label: string; shape?: "circle" | "wide" | "square" }) {
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  async function pick(file?: File) {
    if (!file) return;
    if (file.size > MAX) return toast.error("Images must be 5 MB or smaller.");
    setPct(0);
    try {
      const res = await api.upload(file, folder, setPct);
      onChange(res.url);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPct(null);
    }
  }
  const box = shape === "circle" ? "size-24 rounded-full" : shape === "square" ? "size-24 rounded-2xl" : "aspect-[3/1] w-full rounded-2xl";
  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => input.current?.click()} className={cn("group relative shrink-0 overflow-hidden border border-line bg-surface-2", box)} aria-label={label}>
        {value ? <Image src={value} alt="" fill sizes="300px" className="object-cover" /> : <ImagePlus className="absolute inset-0 m-auto size-6 text-muted" />}
        <span className="absolute inset-0 grid place-items-center bg-black/45 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">{pct !== null ? `${pct}%` : "Change"}</span>
        {pct !== null && <span className="skeleton absolute inset-0 rounded-none opacity-70" />}
      </button>
      {shape !== "wide" && (
        <div className="text-sm">
          <p className="font-semibold text-ink">{label}</p>
          <p className="text-muted">JPG, PNG or WebP, up to 5 MB.</p>
          {value && (
            <button type="button" onClick={() => onChange("")} className="mt-1 text-[13px] font-semibold text-danger hover:underline">
              Remove
            </button>
          )}
        </div>
      )}
      <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files?.[0]).finally(() => (e.target.value = ""))} />
    </div>
  );
}
