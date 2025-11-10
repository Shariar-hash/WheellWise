"use client";

import { useEffect, useState } from "react";

export default function ViewCounter() {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    // Increment view count on page load
    fetch("https://api.countapi.xyz/hit/wheelwise.app/visits")
      .then((res) => res.json())
      .then((data) => {
        setViews(data.value);
      })
      .catch((err) => console.error("Error tracking view:", err));
  }, []);

  if (views === null) return null;

  return (
    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      <span>{views.toLocaleString()} views</span>
    </div>
  );
}
