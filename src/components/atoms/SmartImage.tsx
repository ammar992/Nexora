"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/resources/utils/cn";

/** next/image with a shimmer while loading, a fade-in, and a graceful fallback on error. */
export function SmartImage({ className, alt, src, ...rest }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn("grid size-full place-items-center bg-surface-2 text-muted", className)} role="img" aria-label={alt}>
        <ImageOff className="size-6 opacity-60" aria-hidden />
      </div>
    );
  }
  return (
    <>
      {!loaded && <span className="skeleton absolute inset-0 rounded-none" aria-hidden />}
      <Image
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn("object-cover transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0", className)}
        {...rest}
      />
    </>
  );
}
