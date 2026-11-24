"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Item = { id: string; note: string };
type Queue = { items: Item[]; enqueue: (note: string) => void; clear: () => void };
export const useOfflineQueue = create<Queue>()(persist((set) => ({
  items: [],
  enqueue: (note) => set((state) => ({ items: [...state.items, { id: crypto.randomUUID(), note }] })),
  clear: () => set({ items: [] }),
}), { name: "erp-offline" }));
