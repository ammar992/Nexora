"use client";

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/interceptor/api";

export type ClientSession = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "vendor" | "admin";
  avatar: string;
  emailVerified: boolean;
  vendorId: string | null;
  vendorStatus: string | null;
} | null;

type Ctx = { user: ClientSession; logout: () => Promise<void> };

const SessionContext = createContext<Ctx>({ user: null, logout: async () => {} });

/** The server layout passes the authenticated user down; mutations call router.refresh(). */
export function SessionProvider({ user, children }: { user: ClientSession; children: React.ReactNode }) {
  const router = useRouter();
  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    router.push("/");
    router.refresh();
  }, [router]);
  return <SessionContext.Provider value={{ user, logout }}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
