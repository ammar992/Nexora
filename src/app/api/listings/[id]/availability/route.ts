import { route, ok, ApiError, assertObjectId } from "@/server/http";
import { Listing } from "@/server/models/Listing";
import { getDayAvailability } from "@/server/services/availability";

export const GET = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  assertObjectId(id, "service");
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, "Pick a valid date.");
  const listing = await Listing.findOne({ _id: id, status: "approved", type: "service" }).select("availability").lean();
  if (!listing) throw new ApiError(404, "This service isn't available.");
  const slots = await getDayAvailability(listing, date);
  return ok({ date, slots }, { headers: { "Cache-Control": "no-store" } });
});
