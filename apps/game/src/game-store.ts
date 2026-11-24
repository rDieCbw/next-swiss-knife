"use client";
import { create } from "zustand";
type Game = { x: number; y: number; setPosition: (x: number, y: number) => void };
export const useGame = create<Game>((set) => ({ x: 0, y: 0, setPosition: (x, y) => set({ x, y }) }));
