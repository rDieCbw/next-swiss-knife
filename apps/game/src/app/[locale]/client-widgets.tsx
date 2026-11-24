"use client";

import dynamic from "next/dynamic";

export const GameCanvas = dynamic(() => import("./canvas").then((mod) => mod.GameCanvas), { ssr: false });
