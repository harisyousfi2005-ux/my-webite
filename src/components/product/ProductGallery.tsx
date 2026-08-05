"use client";

import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";
import type { Tone } from "@/types";

const TONE_CLASSES: Record<Tone, string> = {
  ink: "bg-ink",
  navy: "bg-navy",
  clay: "bg-clay",
  sand: "bg-sand",
  dune: "bg-dune",
};

export function ProductGallery({
  images,
  name,
  tone,
}: {
  images: string[];
  name: string;
  tone: Tone;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [activeAngle, setActiveAngle] = useState(0);
  const angleCount = images.length;

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (angleCount <= 1 || !frameRef.current) return;
    const { left, width } = frameRef.current.getBoundingClientRect();
    const ratio = (event.clientX - left) / width;
    const next = Math.min(
      angleCount - 1,
      Math.max(0, Math.floor(ratio * angleCount)),
    );
    setActiveAngle(next);
  }

  return (
    <div
      ref={frameRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setActiveAngle(0)}
      className={`relative aspect-[4/5] w-full overflow-hidden ${TONE_CLASSES[tone]}`}
    >
      {images.map((src, angleIndex) => (
        <Image
          key={src}
          src={src}
          alt={`${name} — angle ${angleIndex + 1}`}
          fill
          priority={angleIndex === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={`object-cover transition-opacity duration-200 ease-out ${
            angleIndex === activeAngle ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {angleCount > 1 && (
        <div className="pointer-events-none absolute bottom-4 right-4 flex gap-1.5">
          {images.map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                dotIndex === activeAngle ? "bg-paper" : "bg-paper/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
