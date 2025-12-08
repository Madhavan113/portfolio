"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page visit
    const track = async () => {
      try {
        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: pathname,
            referrer: document.referrer || null,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (e) {
        // Silently fail - don't impact user experience
      }
    };

    track();
  }, [pathname]);

  return null; // This component doesn't render anything
}

