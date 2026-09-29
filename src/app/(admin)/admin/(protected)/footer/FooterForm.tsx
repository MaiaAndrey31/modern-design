"use client";

import { SelectField, ToggleField } from "@/components/admin/fields";
import { FormFooter, LinkField, LocalizedField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateFooterAction } from "@/app/(admin)/admin/_actions/navigation";
import { LOGO_VARIANTS, LOGO_VARIANT_LABELS, type LogoVariant, type NavigationItemTypeId } from "@/lib/navigation/registry";

export interface FooterValues {
  logoVariant: LogoVariant;
  showWordmark: boolean;
  descriptionPt: string | null;
  descriptionEn: string | null;
  copyrightPt: string;
  copyrightEn: string | null;
  backToTopLabelPt: string;
  backToTopLabelEn: string | null;
  showBookingCta: boolean;
  bookingLabelPt: string;
  bookingLabelEn: string | null;
  bookingType: NavigationItemTypeId;
  bookingTarget: string;
  showSocials: boolean;
  showContact: boolean;
}

export function FooterForm({ initial }: { initial: FooterValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateFooterAction);

  return (
    <form action={formAction} className="space-y-8">
      <Card title="Marca">
        <SelectField label="Logo exibida" name="logoVariant" defaultValue={initial.logoVariant}>
          {LOGO_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {LOGO_VARIANT_LABELS[v]}
            </option>
          ))}
        </SelectField>
        <ToggleField label="Nome da marca em tamanho grande" name="showWordmark" defaultChecked={initial.showWordmark} hint="Wordmark de ponta a ponta no fim da página." />
        <LocalizedField label="Descrição (opcional)" name="description" multiline maxLength={600} defaultPt={initial.descriptionPt} defaultEn={initial.descriptionEn} state={state} />
      </Card>

      <Card title="Textos">
        <LocalizedField
          label="Copyright"
          name="copyright"
          required
          maxLength={200}
          hint={
            <>
              Use <code>{"{year}"}</code> para o ano atual e <code>{"{brand}"}</code> para o nome da marca.
            </>
          }
          defaultPt={initial.copyrightPt}
          defaultEn={initial.copyrightEn}
          state={state}
        />
        <LocalizedField label="Voltar ao topo" name="backToTopLabel" required maxLength={40} defaultPt={initial.backToTopLabelPt} defaultEn={initial.backToTopLabelEn} state={state} />
      </Card>

      <Card title="Contato e redes">
        <ToggleField label="Mostrar contato" name="showContact" defaultChecked={initial.showContact} hint="E-mail/telefone de Configurações → Site." />
        <ToggleField label="Mostrar redes sociais" name="showSocials" defaultChecked={initial.showSocials} hint="Redes marcadas como “Footer”." />
      </Card>

      <Card title="Botão de contratação">
        <ToggleField label="Exibir botão" name="showBookingCta" defaultChecked={initial.showBookingCta} />
        <LinkField
          label="Botão"
          prefix="bookingCta"
          defaultType={initial.bookingType}
          defaultTarget={initial.bookingTarget}
          defaultLabelPt={initial.bookingLabelPt}
          defaultLabelEn={initial.bookingLabelEn}
          state={state}
        />
      </Card>

      <FormFooter state={state} showSaved={showSaved} />
    </form>
  );
}
