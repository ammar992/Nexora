import "server-only";
import type { Types } from "mongoose";
import { Booking } from "@/server/models/Booking";
import { ApiError } from "@/server/http";
import { PAYMENT_HOLD_MINUTES } from "@/resources/utils/constant";
import {
  DEFAULT_AVAILABILITY,
  generateSlots,
  isDateBookable,
  isSlotInFuture,
  type AvailabilityRules,
} from "@/resources/utils/slots";

export function rulesFor(listing: { availability?: Partial<AvailabilityRules> | null }): AvailabilityRules {
  return { ...DEFAULT_AVAILABILITY, ...(listing.availability ?? {}) } as AvailabilityRules;
}

/** Filter for bookings that currently hold capacity. Stale unpaid holds are ignored. */
function holdingFilter(listingId: Types.ObjectId | string, date: string) {
  return {
    listing: listingId,
    date,
    $or: [
      { status: { $in: ["pending", "confirmed"] } },
      { status: "pending_payment", createdAt: { $gt: new Date(Date.now() - PAYMENT_HOLD_MINUTES * 60_000) } },
    ],
  };
}

/** Remaining capacity for each slot of a day. Empty array if the day isn't bookable. */
export async function getDayAvailability(listing: { _id: Types.ObjectId | string; availability?: Partial<AvailabilityRules> | null }, date: string) {
  const rules = rulesFor(listing);
  if (!isDateBookable(date, rules)) return [];
  const slots = generateSlots(rules);
  const used = await Booking.aggregate<{ _id: string; n: number }>([
    { $match: holdingFilter(listing._id, date) },
    { $group: { _id: "$timeSlot", n: { $sum: "$guests" } } },
  ]);
  const usedMap = new Map(used.map((u) => [u._id, u.n]));
  return slots.map((time) => {
    const remaining = Math.max(0, rules.capacityPerSlot - (usedMap.get(time) ?? 0));
    return { time, remaining, available: remaining > 0 && isSlotInFuture(date, time, rules) };
  });
}

export async function usedCapacity(listingId: Types.ObjectId | string, date: string, timeSlot: string) {
  const [row] = await Booking.aggregate<{ n: number }>([
    { $match: { ...holdingFilter(listingId, date), timeSlot } },
    { $group: { _id: null, n: { $sum: "$guests" } } },
  ]);
  return row?.n ?? 0;
}

/** Throws a 409 explaining why the slot can't be booked. */
export async function assertSlotAvailable(
  listing: { _id: Types.ObjectId | string; availability?: Partial<AvailabilityRules> | null },
  date: string,
  timeSlot: string,
  guests: number
) {
  const rules = rulesFor(listing);
  if (!isDateBookable(date, rules)) throw new ApiError(409, "That date isn't available. Please pick another day.");
  if (!generateSlots(rules).includes(timeSlot)) throw new ApiError(409, "That time isn't offered for this service.");
  if (!isSlotInFuture(date, timeSlot, rules)) {
    throw new ApiError(409, `This service needs at least ${rules.leadTimeHours} hours' notice. Please pick a later time.`);
  }
  if (guests > rules.capacityPerSlot) throw new ApiError(409, `This slot takes up to ${rules.capacityPerSlot} ${rules.capacityPerSlot === 1 ? "person" : "people"}.`);
  const used = await usedCapacity(listing._id, date, timeSlot);
  if (used + guests > rules.capacityPerSlot) throw new ApiError(409, "Someone just booked that slot. Please choose another time.");
  return rules;
}
