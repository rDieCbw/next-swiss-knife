"use client";

import dynamic from "next/dynamic";

export const Board = dynamic(() => import("./board").then((mod) => mod.Board), { ssr: false });
