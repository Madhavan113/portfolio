import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";

// Never cache tracking
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    
    // Get IP from Vercel/proxy headers
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0] || realIp || "unknown";
    
    // Get page info from request body
    const body = await request.json().catch(() => ({}));
    const { page, referrer, entryReferrer, entryPage, utm, userAgent } = body;
    
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
