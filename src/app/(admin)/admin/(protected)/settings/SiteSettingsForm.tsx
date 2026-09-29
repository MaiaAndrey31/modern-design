"use client";

import { SelectField, TextField } from "@/components/admin/fields";
import { FormFooter } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateSiteSettingsAction } from "@/app/(admin)/admin/_actions/settings";

export interface SiteSettingsValues {
  siteUrl: string;
  defaultLocale: "pt" | "en";
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
}

export function SiteSettingsForm({ initial, envSiteUrl }: { initial: SiteSettingsValues; envSiteUrl: string }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateSiteSettingsAction);
  const err = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form action={formAction} className="max-w-2xl space-y-8">
      <Card title="Endereço e idioma">
        <TextField
          label="URL pública do site"
          name="siteUrl"
          type="url"
          placeholder={envSiteUrl}
          defaultValue={initial.siteUrl}
          error={err("siteUrl")}
        />
        <p className="text-xs text-neutral-500">
          Usada em SEO, compartilhamento e sitemap. Vazio = valor do ambiente (<code>{envSiteUrl}</code>).
        </p>
        <SelectField label="Idioma padrão" name="defaultLocale" defaultValue={initial.defaultLocale} error={err("defaultLocale")}>
          <option value="pt">Português</option>
          <option value="en">English</option>
        </SelectField>
        <p className="text-xs text-neutral-500">
          Idioma em que o site abre para quem ainda não escolheu um. A escolha do visitante continua salva no navegador.
        </p>
      </Card>

      <Card title="Contato" description="Exibido no footer (quando ativado) e usado pelos botões de contato.">
        <TextField label="E-mail" name="contactEmail" type="email" defaultValue={initial.contactEmail} error={err("contactEmail")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Telefone" name="contactPhone" inputMode="tel" placeholder="5535999999999" defaultValue={initial.contactPhone} error={err("contactPhone")} />
          <TextField label="WhatsApp" name="whatsappNumber" inputMode="tel" placeholder="5535999999999" defaultValue={initial.whatsappNumber} error={err("whatsappNumber")} />
        </div>
        <p className="text-xs text-neutral-500">Somente números, com DDI (ex.: 55 + DDD + número).</p>
      </Card>

      <FormFooter state={state} showSaved={showSaved} />
    </form>
  );
}
