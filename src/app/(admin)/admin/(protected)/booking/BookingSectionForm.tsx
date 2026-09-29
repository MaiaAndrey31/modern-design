"use client";

import { TextField, ToggleField, inputClass } from "@/components/admin/fields";
import { FormFooter, LocalizedField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import { useSavedFeedback } from "@/components/admin/useSavedFeedback";
import { updateBookingSectionAction } from "@/app/(admin)/admin/_actions/content";
import { BOOKING_FORM_FIELDS, type BookingFieldLabels } from "@/lib/booking/fields";

export interface BookingSectionValues {
  successTitlePt: string;
  successTitleEn: string | null;
  successMessagePt: string;
  successMessageEn: string | null;
  submitLabelPt: string;
  submitLabelEn: string | null;
  pausedMessagePt: string;
  pausedMessageEn: string | null;
  fieldLabels: BookingFieldLabels;
  notifyEmail: string;
  isFormEnabled: boolean;
}

export function BookingSectionForm({ initial }: { initial: BookingSectionValues }) {
  const { state, formAction, showSaved } = useSavedFeedback(updateBookingSectionAction);
  const err = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form action={formAction} className="space-y-8">
      <Card title="Formulário">
        <ToggleField
          label="Receber pedidos pelo site"
          name="isFormEnabled"
          defaultChecked={initial.isFormEnabled}
          hint="Desativado, o site mostra a mensagem de pausa no lugar do formulário."
        />
        <LocalizedField label="Texto do botão de envio" name="submitLabel" required maxLength={40} defaultPt={initial.submitLabelPt} defaultEn={initial.submitLabelEn} state={state} />
        <LocalizedField label="Mensagem de pausa" name="pausedMessage" required multiline rows={2} maxLength={300} defaultPt={initial.pausedMessagePt} defaultEn={initial.pausedMessageEn} state={state} />
      </Card>

      <Card title="Rótulos dos campos" description="Os campos do formulário são fixos; aqui você edita apenas os nomes exibidos.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400">
                <th className="pb-2 font-medium">Campo</th>
                <th className="pb-2 font-medium">Português</th>
                <th className="pb-2 font-medium">English</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {BOOKING_FORM_FIELDS.map((field) => (
                <tr key={field}>
                  <td className="py-2 pr-3 font-mono text-xs text-neutral-500">{field}</td>
                  <td className="py-2 pr-3">
                    <input
                      name={`label_${field}_pt`}
                      aria-label={`${field} — português`}
                      required
                      maxLength={60}
                      defaultValue={initial.fieldLabels[field].pt}
                      className={`${inputClass} mt-0`}
                    />
                    {err(`fieldLabels.${field}.pt`) && <p className="mt-1 text-xs text-red-600">{err(`fieldLabels.${field}.pt`)}</p>}
                  </td>
                  <td className="py-2">
                    <input
                      name={`label_${field}_en`}
                      aria-label={`${field} — English`}
                      maxLength={60}
                      placeholder={initial.fieldLabels[field].pt}
                      defaultValue={initial.fieldLabels[field].en ?? ""}
                      className={`${inputClass} mt-0`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-neutral-500">Inglês vazio = usa o português.</p>
      </Card>

      <Card title="Após o envio">
        <LocalizedField label="Título de sucesso" name="successTitle" required maxLength={120} defaultPt={initial.successTitlePt} defaultEn={initial.successTitleEn} state={state} />
        <LocalizedField label="Mensagem de sucesso" name="successMessage" required multiline rows={2} maxLength={300} defaultPt={initial.successMessagePt} defaultEn={initial.successMessageEn} state={state} />
        <TextField
          label="E-mail para notificação (opcional)"
          name="notifyEmail"
          type="email"
          defaultValue={initial.notifyEmail}
          error={err("notifyEmail")}
        />
        <p className="text-xs text-neutral-500">Uso interno — nunca exibido no site. O envio de e-mail depende de um provedor configurado.</p>
      </Card>

      <FormFooter state={state} showSaved={showSaved} />
    </form>
  );
}
