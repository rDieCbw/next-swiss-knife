"use client";

import dynamic from "next/dynamic";

export const Room = dynamic(() => import("./room").then((mod) => mod.Room), { ssr: false });
