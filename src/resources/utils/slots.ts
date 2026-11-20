/**
 * Time-slot helpers shared by the booking widget (client) and availability validation (server).
 * Dates are plain YYYY-MM-DD strings and times HH:mm in the vendor's local time.
 */

export type AvailabilityRules = {
  days: number[];
  startTime: string;
  endTime: string;
  slotMinutes: number;
  capacityPerSlot: number;
  blockedDates: string[];
  leadTimeHours: number;
  maxAdvanceDays: number;
};

export const DEFAULT_AVAILABILITY: AvailabilityRules = {
  days: [1, 2, 3, 4, 5],
  startTime: "09:00",
  endTime: "17:00",
  slotMinutes: 60,
  capacityPerSlot: 1,
  blockedDates: [],
  leadTimeHours: 2,
  maxAdvanceDays: 60,
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** All slot start times for a day, regardless of bookings. */
export function generateSlots(rules: AvailabilityRules): string[] {
  const start = toMinutes(rules.startTime);
  const end = toMinutes(rules.endTime);
  const out: string[] = [];
  for (let t = start; t + rules.slotMinutes <= end; t += rules.slotMinutes) out.push(fromMinutes(t));
  return out;
}

/** Whether a calendar day can be booked at all under the vendor's rules. */
export function isDateBookable(dateKey: string, rules: AvailabilityRules, now = new Date()) {
  const date = parseDateKey(dateKey);
  if (Number.isNaN(date.getTime())) return false;
  const today = parseDateKey(toDateKey(now));
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0 || diffDays > rules.maxAdvanceDays) return false;
  if (!rules.days.includes(date.getDay())) return false;
  if (rules.blockedDates.includes(dateKey)) return false;
  return true;
}

/** Whether a slot start time is far enough in the future to respect lead time. */
export function isSlotInFuture(dateKey: string, slot: string, rules: AvailabilityRules, now = new Date()) {
  const [h, m] = slot.split(":").map(Number);
  const at = parseDateKey(dateKey);
  at.setHours(h, m, 0, 0);
  return at.getTime() - now.getTime() >= rules.leadTimeHours * 3_600_000;
}
