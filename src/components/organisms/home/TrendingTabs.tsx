"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs } from "@/components/molecules/Tabs";
import { ListingCard } from "@/components/molecules/ListingCard";
import { EmptyState } from "@/components/molecules/EmptyState";
import type { ListingCard as Card } from "@/server/services/catalog";

export function TrendingTabs({ products, services, saved }: { products: Card[]; services: Card[]; saved: string[] }) {
  const [tab, setTab] = useState<"product" | "service">("product");
  const list = tab === "product" ? products : services;
  return (
    <div>
      <Tabs id="trending" value={tab} onChange={setTab} items={[{ value: "product", label: "Products" }, { value: "service", label: "Services" }]} className="mb-8" />
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
          {list.length === 0 ? (
            <EmptyState title="Nothing trending yet" description="As customers order and book, the most popular listings show up here." />
          ) : (
            <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
              {list.slice(0, 8).map((l) => (
                <div key={l._id} className="w-[78vw] shrink-0 snap-start sm:w-[46vw] md:w-auto">
                  <ListingCard listing={l} saved={saved.includes(l._id)} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
