"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaPickerModal } from "./MediaPickerModal";
import type { UploadKind } from "@/lib/uploadFile";

export interface MediaValue {
  id: string;
  url: string;
}

interface MediaPickerFieldProps {
  label: string;
  folder: string;
  value: MediaValue | null;
  onChange: (value: MediaValue | null) => void;
  aspect?: string; // Tailwind aspect-ratio class, e.g. "aspect-video"
  required?: boolean;
  kind?: UploadKind;
}

export function MediaPickerField({ label, folder, value, onChange, aspect = "aspect-video", required, kind = "image" }: MediaPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <div className={`relative mt-1.5 w-full max-w-xs overflow-hidden rounded-md border ${aspect} ${value ? "border-neutral-200" : "border-dashed border-neutral-300"}`}>
        {value ? (
          <>
            {kind === "video" ? (
              <video src={value.url} muted playsInline loop autoPlay className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <Image src={value.url} alt="" fill sizes="320px" className="object-cover" unoptimized />
            )}
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-neutral-800 shadow"
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-neutral-800 shadow"
              >
                Remover
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-neutral-400 hover:text-neutral-600"
          >
            <span className="text-xs">{kind === "video" ? "+ Escolher vídeo" : "+ Escolher imagem"}</span>
          </button>
        )}
      </div>

      {isOpen && (
        <MediaPickerModal
          folder={folder}
          kind={kind}
          onClose={() => setIsOpen(false)}
          onSelect={(media) => {
            onChange(media);
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
}
