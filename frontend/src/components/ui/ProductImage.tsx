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
  const frameClasses = frame ? "rounded-2xl border border-[var(--border-subtle)]" : "";

  if (errored) {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center bg-[var(--bg-elevated)] text-5xl ${frameClasses} ${className}`}
      >
        {emoji}
      </div>
    );
  }

  const id = photoId ?? productImagePhotoId(name);

  return (
    <div className={`relative w-full h-full overflow-hidden ${frameClasses} ${className}`}>
      <Image
        src={`https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop&auto=format&q=75`}
        alt={name}
        fill
        sizes={sizes ?? "100vw"}
        priority={priority}
        className="object-cover"
        onError={() => setErrored(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none" />
    </div>
  );
}
