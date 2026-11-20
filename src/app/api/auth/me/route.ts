import { route, ok } from "@/server/http";
import { getCurrentUser } from "@/server/auth/session";

export const GET = route(async () => {
  return ok({ user: await getCurrentUser() });
});
