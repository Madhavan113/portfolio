"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Keep the secret dashboard off analytics.
    if (pathname.startsWith("/secret")) return;

    const trackVisit = async () => {
      try {
        const utm = {
          source: searchParams.get("utm_source"),
          medium: searchParams.get("utm_medium"),
          campaign: searchParams.get("utm_campaign"),
          term: searchParams.get("utm_term"),
          content: searchParams.get("utm_content"),
        };

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
      } catch {
        // Never block rendering for analytics failures.
      }
    };

    trackVisit();
  }, [pathname, searchParams]);

  return null;
}

export default function Tracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  );
}
