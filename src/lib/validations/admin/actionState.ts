export interface ActionState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export const IDLE_STATE: ActionState = { ok: true };
