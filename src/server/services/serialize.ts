import type { Types } from "mongoose";

/**
 * Converts lean Mongoose documents into plain JSON (ObjectIds → strings, Dates → ISO strings)
 * so they can be passed from server components to client components.
 */
type Plain<T> = T extends Types.ObjectId
  ? string
  : T extends Date
    ? string
    : T extends (infer U)[]
      ? Plain<U>[]
      : T extends object
        ? { [K in keyof T]: Plain<T[K]> }
        : T;

export function toPlain<T>(value: T): Plain<T> {
  return JSON.parse(JSON.stringify(value)) as Plain<T>;
}

export type { Plain };

export function reference(prefix: string) {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `${prefix}-${t}${r}`;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
