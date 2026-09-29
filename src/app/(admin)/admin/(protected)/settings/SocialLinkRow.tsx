"use client";

import { useTransition } from "react";
import { TextField, SaveButton } from "@/components/admin/fields";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { upsertSocialLinkAction, disableSocialLinkAction } from "@/app/(admin)/admin/_actions/settings";
import type { SocialPlatform } from "@/generated/prisma/client";

export function SocialLinkRow({
  platform,
  defaultLabel,
  url,
  configured,
}: {
  platform: SocialPlatform;
  defaultLabel: string;
  url: string;
  configured: boolean;
}) {
  const { state, formAction, showSaved } = useSavedFeedback(upsertSocialLinkAction);
  const [isDisabling, startTransition] = useTransition();

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 border-b border-neutral-200 py-4 last:border-0">
      <input type="hidden" name="platform" value={platform} />
      <div className="w-40">
        <TextField label="Rede" name="label" defaultValue={defaultLabel} required />
      </div>
      <div className="min-w-[240px] flex-1">
        <TextField
          label="URL"
          name="url"
          type="url"
          defaultValue={configured ? url : ""}
          placeholder="https://..."
          required
          error={state.fieldErrors?.url?.[0]}
        />
      </div>
      <SaveButton>Salvar</SaveButton>
      {configured && (
        <button
          type="button"
          disabled={isDisabling}
          onClick={() => startTransition(() => disableSocialLinkAction(platform))}
          className="text-xs text-neutral-500 underline hover:text-neutral-900"
        >
          Desativar
        </button>
      )}
      {showSaved && <span className="text-xs text-green-600">Salvo.</span>}
    </form>
  );
}
