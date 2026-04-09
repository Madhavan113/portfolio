import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /slurp/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /wget/i,
  /curl/i,
  /python-requests/i,
  /go-http-client/i,
  /lighthouse/i,
  /pagespeed/i,
];

const recentRequests = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  if (userAgent.length < 20) return true;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = recentRequests.get(ip) || [];
  const recent = requests.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return true;

  recent.push(now);
  recentRequests.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json({ success: true });
    }

    const body = await request.json().catch(() => ({}));
    const { page, referrer, entryReferrer, entryPage, utm, userAgent } = body;

    if (!page || typeof page !== "string") {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }

    if (isBot(typeof userAgent === "string" ? userAgent : null)) {
      return NextResponse.json({ success: true });
    }

    let location: {
      country: string | null;
      countryCode: string | null;
      region: string | null;
      city: string | null;
      zip: string | null;
      lat: number | null;
      lon: number | null;
      timezone: string | null;
      isp: string | null;
      org: string | null;
    } | null = null;

    if (ip !== "unknown" && ip !== "::1" && ip !== "127.0.0.1") {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org`,
          { cache: "no-store" }
        );
        const geoData = await geoRes.json();

        if (geoData.status === "success") {
          location = {
            country: geoData.country ?? null,
            countryCode: geoData.countryCode ?? null,
            region: geoData.regionName ?? null,
            city: geoData.city ?? null,
            zip: geoData.zip ?? null,
            lat: typeof geoData.lat === "number" ? geoData.lat : null,
            lon: typeof geoData.lon === "number" ? geoData.lon : null,
            timezone: geoData.timezone ?? null,
            isp: geoData.isp ?? null,
            org: geoData.org ?? null,
          };
        }
      } catch (error) {
        console.error("Geo lookup failed:", error);
      }
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("visits").insert({
      ip,
      page,
      referrer: typeof referrer === "string" ? referrer : null,
      entry_referrer: typeof entryReferrer === "string" ? entryReferrer : null,
      entry_page: typeof entryPage === "string" ? entryPage : null,
      utm_source: utm?.source ?? null,
      utm_medium: utm?.medium ?? null,
      utm_campaign: utm?.campaign ?? null,
      user_agent: typeof userAgent === "string" ? userAgent : "unknown",
      country: location?.country ?? null,
      country_code: location?.countryCode ?? null,
      region: location?.region ?? null,
      city: location?.city ?? null,
      zip: location?.zip ?? null,
      lat: location?.lat ?? null,
      lon: location?.lon ?? null,
      timezone: location?.timezone ?? null,
      isp: location?.isp ?? null,
      org: location?.org ?? null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}
