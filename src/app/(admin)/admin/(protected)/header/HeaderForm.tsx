"use client";

import { SelectField, ToggleField } from "@/components/admin/fields";
import { FormFooter, LinkField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateHeaderAction } from "@/app/(admin)/admin/_actions/navigation";
import { LOGO_VARIANTS, LOGO_VARIANT_LABELS, type LogoVariant, type NavigationItemTypeId } from "@/lib/navigation/registry";

export interface HeaderValues {
  logoVariant: LogoVariant;
  showLanguageSwitch: boolean;
  showSocials: boolean;
  showCta: boolean;
  ctaLabelPt: string;
  ctaLabelEn: string | null;
  ctaType: NavigationItemTypeId;
  ctaTarget: string;
}

export function HeaderForm({ initial }: { initial: HeaderValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateHeaderAction);

  return (
    <form action={formAction} className="space-y-8">
      <Card title="Aparência">
        <SelectField label="Logo exibida" name="logoVariant" defaultValue={initial.logoVariant} error={state.fieldErrors?.logoVariant?.[0]}>
          {LOGO_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {LOGO_VARIANT_LABELS[v]}
            </option>
          ))}
        </SelectField>
        <p className="text-xs text-neutral-500">Sem a logo escolhida cadastrada, o site usa a logo principal ou o nome da marca.</p>
        <ToggleField label="Seletor de idioma (PT / EN)" name="showLanguageSwitch" defaultChecked={initial.showLanguageSwitch} />
        <ToggleField label="Ícones de redes sociais" name="showSocials" defaultChecked={initial.showSocials} hint="Mostra as redes marcadas como “Header” em Redes sociais." />
      </Card>

      <Card title="Botão de destaque (CTA)">
        <ToggleField label="Exibir botão" name="showCta" defaultChecked={initial.showCta} />
        <LinkField
          label="Botão"
          prefix="cta"
          defaultType={initial.ctaType}
          defaultTarget={initial.ctaTarget}
          defaultLabelPt={initial.ctaLabelPt}
          defaultLabelEn={initial.ctaLabelEn}
          state={state}
        />
      </Card>

      <FormFooter state={state} showSaved={showSaved} />
    </form>
  );
}
