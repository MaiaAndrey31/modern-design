"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SelectField, TextField, ToggleField } from "@/components/admin/fields";
import { FormFooter } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_IDS, type SocialPlatformId } from "@/lib/social/registry";
import type { ActionState } from "@/lib/validations/admin/actionState";

export interface SocialValues {
  platform: SocialPlatformId;
  label: string;
  url: string;
  enabled: boolean;
  showInHeader: boolean;
  showInFooter: boolean;
  showInMusic: boolean;
}

export function SocialForm({ initial, action }: { initial: SocialValues; action: (prev: ActionState, formData: FormData) => Promise<ActionState> }) {
  const [state, formAction] = useActionState(action, { ok: true });
  const [platform, setPlatform] = useState<SocialPlatformId>(initial.platform);
  const [label, setLabel] = useState(initial.label);
  const def = SOCIAL_PLATFORMS[platform];
  const err = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form action={formAction} className="max-w-2xl space-y-8">
      <Card>
        <SelectField
          label="Plataforma"
          name="platform"
          value={platform}
          onChange={(e) => {
            const next = e.target.value as SocialPlatformId;
            // Keep a custom label; replace the auto one.
            if (!label || label === SOCIAL_PLATFORMS[platform].label) setLabel(SOCIAL_PLATFORMS[next].label);
            setPlatform(next);
          }}
          error={err("platform")}
        >
          {SOCIAL_PLATFORM_IDS.map((id) => (
            <option key={id} value={id}>
              {SOCIAL_PLATFORMS[id].label}
            </option>
          ))}
        </SelectField>
        <TextField label="Rótulo" name="label" required maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} error={err("label")} />
        <TextField
          label="Link"
          name="url"
          type="url"
          required
          defaultValue={initial.url}
          placeholder={def.hosts.length ? `https://${def.hosts[0]}/…` : "https://…"}
          error={err("url")}
        />
        {def.hosts.length > 0 && <p className="text-xs text-neutral-500">Aceita links de: {def.hosts.join(", ")}.</p>}
      </Card>

      <Card title="Onde aparece">
        <ToggleField label="Ativa" name="enabled" defaultChecked={initial.enabled} />
        <ToggleField label="Header" name="showInHeader" defaultChecked={initial.showInHeader} />
        <ToggleField label="Footer" name="showInFooter" defaultChecked={initial.showInFooter} />
        <ToggleField
          label="Seção de música"
          name="showInMusic"
          defaultChecked={initial.showInMusic}
          hint={def.streaming ? "Plataforma de streaming — recomendado." : "Normalmente usado apenas para plataformas de streaming."}
        />
      </Card>

      <FormFooter
        state={state}
        label="Salvar rede"
        extra={
          <Link href="/admin/social" className="text-sm text-neutral-500 hover:text-neutral-900">
            Cancelar
          </Link>
        }
      />
    </form>
  );
}
