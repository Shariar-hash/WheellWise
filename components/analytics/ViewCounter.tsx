"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ViewCounter() {
  const [views, setViews] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const incrementViewCount = async () => {
      try {
        // Increment view count in Supabase
        const { data, error } = await supabase.rpc('increment_view_count');
        
        if (error) {
          console.error("❌ Error incrementing views:", error);
          // Fallback: just get current count
          const { data: countData } = await supabase.rpc('get_view_count');
          if (countData !== null) {
            setViews(countData);
          }
        } else {
          console.log("✅ View count incremented to:", data);
          setViews(data || 0);
          setAnimating(true);
          setTimeout(() => setAnimating(false), 500);
        }
      } catch (err) {
        console.error("❌ Failed to track views:", err);
      } finally {
        setLoading(false);
      }
    };

    incrementViewCount();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
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
      <span className="font-medium text-gray-300">
        {views.toLocaleString()} views
      </span>
    </div>
  );
}
