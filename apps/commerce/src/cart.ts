"use client";

import { create } from "zustand";

type Line = { sku: string; quantity: number };
type CartState = { lines: Line[]; interactions: Record<string, number>; add: (sku: string) => void };

export const useCart = create<CartState>((set) => ({
  lines: [],
  interactions: {},
  add: (sku) => set((state) => {
    const lines = state.lines.some((line) => line.sku === sku)
      ? state.lines.map((line) => line.sku === sku ? { ...line, quantity: line.quantity + 1 } : line)
      : [...state.lines, { sku, quantity: 1 }];
    return { lines, interactions: { ...state.interactions, [sku]: (state.interactions[sku] ?? 0) + 1 } };
  }),
}));
