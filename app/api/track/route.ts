import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";

// Never cache tracking
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Known bot user agent patterns
const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /slurp/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baidu/i,
  /duckduckbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i,
  /slackbot/i,
  /applebot/i,
  /semrush/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /gptbot/i,
  /chatgpt/i,
  /claude/i,
  /anthropic/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /wget/i,
  /curl/i,
  /httpie/i,
  /python-requests/i,
  /python-urllib/i,
  /go-http-client/i,
  /java\//i,
  /axios/i,
  /node-fetch/i,
  /libwww/i,
  /lwp-/i,
  /scrapy/i,
  /nutch/i,
  /archive/i,
  /preview/i,
  /prefetch/i,
  /lighthouse/i,
  /pagespeed/i,
  /gtmetrix/i,
  /pingdom/i,
  /uptime/i,
  /monitor/i,
  /check/i,
  /health/i,
  /status/i,
];

// Suspicious ISP/org patterns (often data centers/proxies)
const SUSPICIOUS_ISP_PATTERNS = [
  /amazon/i,
  /aws/i,
  /google cloud/i,
  /microsoft azure/i,
  /digitalocean/i,
  /linode/i,
  /vultr/i,
  /ovh/i,
  /hetzner/i,
  /cloudflare/i,
  /akamai/i,
  /fastly/i,
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true; // No UA = suspicious
  if (userAgent.length < 20) return true; // Too short = suspicious
  
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

function isSuspiciousISP(isp: string | null, org: string | null): boolean {
  const combined = `${isp || ""} ${org || ""}`;
  return SUSPICIOUS_ISP_PATTERNS.some(pattern => pattern.test(combined));
}

// Simple rate limiting per IP
const recentRequests = new Map<string, number[]>();
const RATE_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 5; // Max 5 page views per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = recentRequests.get(ip) || [];
  
  // Filter to only recent requests
  const recent = requests.filter(t => now - t < RATE_WINDOW);
  
  if (recent.length >= MAX_REQUESTS) {
    return true;
  }
  
  recent.push(now);
  recentRequests.set(ip, recent);
  
  // Cleanup old IPs periodically
  if (recentRequests.size > 10000) {
    const ips = Array.from(recentRequests.keys());
    for (const oldIp of ips.slice(0, 5000)) {
      recentRequests.delete(oldIp);
    }
  }
  
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    
    // Get IP from Vercel/proxy headers
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0] || realIp || "unknown";
    
    // Rate limit check
    if (isRateLimited(ip)) {
      return NextResponse.json({ success: true }); // Silently ignore
    }
    
    // Get page info from request body
    const body = await request.json().catch(() => ({}));
    const { page, referrer, entryReferrer, entryPage, utm, userAgent } = body;
    
    // Bot detection - silently ignore bots
    if (isBot(userAgent)) {
      return NextResponse.json({ success: true }); // Don't reveal we detected them
    }
    
    // Lookup location using ip-api.com (free, no API key needed)
    let location = null;
    
    if (ip && ip !== "unknown" && ip !== "::1" && ip !== "127.0.0.1") {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org`);
        const geoData = await geoRes.json();
        
        if (geoData.status === "success") {
          location = {
            country: geoData.country,
            countryCode: geoData.countryCode,
            region: geoData.regionName,
            city: geoData.city,
            zip: geoData.zip,
            lat: geoData.lat,
            lon: geoData.lon,
            timezone: geoData.timezone,
            isp: geoData.isp,
            org: geoData.org,
          };
          
          // Check for suspicious data center IPs (optional - uncomment to enable)
          // if (isSuspiciousISP(geoData.isp, geoData.org)) {
          //   return NextResponse.json({ success: true }); // Silently ignore
          // }
        }
      } catch (e) {
        console.error("Geo lookup failed:", e);
      }
    }
    
    // Insert into Supabase
    const { error } = await supabase.from("visits").insert({
      ip,
      page,
      referrer,
      entry_referrer: entryReferrer,
      entry_page: entryPage,
      utm_source: utm?.source || null,
      utm_medium: utm?.medium || null,
      utm_campaign: utm?.campaign || null,
      user_agent: userAgent,
      country: location?.country || null,
      country_code: location?.countryCode || null,
      region: location?.region || null,
      city: location?.city || null,
      zip: location?.zip || null,
      lat: location?.lat || null,
      lon: location?.lon || null,
      timezone: location?.timezone || null,
      isp: location?.isp || null,
      org: location?.org || null,
    });
    
    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
    }
    
    console.log("📍 Visit tracked:", location?.city || ip);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}
