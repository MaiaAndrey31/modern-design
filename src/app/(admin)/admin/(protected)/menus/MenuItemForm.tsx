"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SelectField, ToggleField } from "@/components/admin/fields";
import { FormFooter, LinkField } from "@/components/admin/form";
import { Card } from "@/components/admin/ui";
import { NAVIGATION_LOCATIONS, NAVIGATION_LOCATION_LABELS, type NavigationItemTypeId, type NavigationLocationId } from "@/lib/navigation/registry";
import type { ActionState } from "@/lib/validations/admin/actionState";

export interface MenuItemValues {
  location: NavigationLocationId;
  type: NavigationItemTypeId;
  target: string;
  labelPt: string;
  labelEn: string | null;
  openInNewTab: boolean;
  enabled: boolean;
}

export function MenuItemForm({
  initial,
  action,
}: {
  initial: MenuItemValues;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, { ok: true });

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      <Card>
        <SelectField label="Grupo" name="location" defaultValue={initial.location} error={state.fieldErrors?.location?.[0]}>
          {NAVIGATION_LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {NAVIGATION_LOCATION_LABELS[l]}
            </option>
          ))}
        </SelectField>
        <LinkField
          label="Link"
          prefix="item"
          optional={false}
          errorPath=""
          defaultType={initial.type}
          defaultTarget={initial.target}
          defaultLabelPt={initial.labelPt}
          defaultLabelEn={initial.labelEn}
          state={state}
        />
        <ToggleField label="Abrir em nova aba" name="openInNewTab" defaultChecked={initial.openInNewTab} />
        <ToggleField label="Ativo" name="enabled" defaultChecked={initial.enabled} hint="Desative para esconder o link sem excluí-lo." />
      </Card>
      <FormFooter
        state={state}
        label="Salvar link"
        extra={
          <Link href="/admin/menus" className="text-sm text-neutral-500 hover:text-neutral-900">
            Cancelar
          </Link>
        }
      />
    </form>
  );
}
