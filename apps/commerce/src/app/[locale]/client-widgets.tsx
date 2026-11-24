"use client";

import dynamic from "next/dynamic";

export const Recommendations = dynamic(() => import("./recommendations").then((mod) => mod.Recommendations), {
  ssr: false,
});
