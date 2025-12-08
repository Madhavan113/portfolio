import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { put, list } from "@vercel/blob";

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
    
    const visit = {
      timestamp: new Date().toISOString(),
      ip,
      page,
      referrer,
      entryReferrer,
      entryPage,
      utm,
      userAgent,
      location,
    };
    
    // Store in Vercel Blob
    const filename = `visits/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.json`;
    await put(filename, JSON.stringify(visit, null, 2), { access: "public" });
    
    console.log("📍 Visit tracked:", location?.city || ip);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}

// GET endpoint to view analytics
export async function GET(request: NextRequest) {
  // Simple auth check
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.ANALYTICS_SECRET || "dev-secret";
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  
  // List recent visit blobs
  const { blobs } = await list({ prefix: "visits/", limit });
  
  // Fetch each visit's data
  const visits = await Promise.all(
    blobs.map(async (blob) => {
      const res = await fetch(blob.url);
      return res.json();
    })
  );
  
  // Sort by timestamp descending
  visits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return NextResponse.json({
    total: blobs.length,
    visits,
  });
}
