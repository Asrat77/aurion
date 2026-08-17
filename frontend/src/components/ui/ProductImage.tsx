"use client";

import { useState } from "react";
import Image from "next/image";
import { productImagePhotoId } from "@/lib/productImage";

export default function ProductImage({
  name,
  emoji,
  width,
  height,
  sizes,
  priority,
  frame = true,
  className = "",
  photoId,
}: {
  name: string;
  emoji: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  /** Render the default rounded-2xl + border wrapper. Set false when the
   * parent already supplies its own frame (e.g. an absolutely-positioned
   * background layer inside a card that has its own border/radius). */
  frame?: boolean;
  className?: string;
  /** Override the name-derived Unsplash photo id (for editorial images
   * that aren't a specific product, e.g. hero/section backgrounds). */
  photoId?: string;
}) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const frameClasses = frame ? "rounded-2xl border border-[var(--border-subtle)]" : "";

  const id = photoId ?? productImagePhotoId(name);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[var(--bg-elevated)] ${frameClasses} ${className}`}>
      <div className="absolute inset-0 aurion-pattern opacity-[0.22]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          aria-hidden="true"
          className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--border-gold)] bg-[rgba(5,7,13,0.7)] text-5xl shadow-[0_20px_70px_rgba(214,180,94,0.12)]"
        >
          {emoji}
        </span>
      </div>
      {!errored ? (
        <Image
          src={`https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop&auto=format&q=82`}
          alt={name}
          fill
          sizes={sizes ?? "100vw"}
          priority={priority}
          // The source URL already carries width, height, crop, format and
          // quality, so Unsplash returns exactly what we need. Routing it
          // through the Next optimizer only adds a slow, uncached hop.
          unoptimized
          className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none" />
    </div>
  );
}
