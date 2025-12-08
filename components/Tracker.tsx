"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page visit
    const track = async () => {
      try {
        // Get UTM parameters (more reliable than referrer)
        const utm = {
          source: searchParams.get("utm_source"),
          medium: searchParams.get("utm_medium"),
          campaign: searchParams.get("utm_campaign"),
          term: searchParams.get("utm_term"),
          content: searchParams.get("utm_content"),
        };

        // Get or set the original landing page & referrer (stored in sessionStorage)
        let entryReferrer = sessionStorage.getItem("entry_referrer");
        let entryPage = sessionStorage.getItem("entry_page");
        
        if (!entryPage) {
          entryPage = pathname;
          entryReferrer = document.referrer || null;
          sessionStorage.setItem("entry_page", entryPage);
          if (entryReferrer) sessionStorage.setItem("entry_referrer", entryReferrer);
        }

        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: pathname,
            referrer: document.referrer || null,
            entryReferrer,
            entryPage,
            utm: Object.values(utm).some(Boolean) ? utm : null,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (e) {
        // Silently fail - don't impact user experience
      }
    };

    track();
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}

