"use client";
import { create } from "zustand";
type Alarms = { dismissed: string[]; dismiss: (id: string) => void };
export const useAlarms = create<Alarms>((set) => ({
  dismissed: [],
  dismiss: (id) => set((state) => ({ dismissed: [...state.dismissed, id] })),
}));
