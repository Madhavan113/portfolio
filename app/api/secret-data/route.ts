import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// Never cache this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Server-side only - these are NEVER exposed to client
const SECRET_PASSWORD = process.env.SECRET_PASSWORD || "defaultpassword123";
const SECRET_ANSWER = process.env.SECRET_ANSWER || "defaultanswer";
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString("hex");

// Simple token generation (expires in 1 hour)
function generateToken(): string {
  const expiry = Date.now() + 3600000; // 1 hour
  const data = `${expiry}`;
  const hmac = crypto.createHmac("sha256", TOKEN_SECRET).update(data).digest("hex");
  return `${expiry}.${hmac}`;
}

function verifyToken(token: string): boolean {
  try {
    const [expiry, hmac] = token.split(".");
    if (Date.now() > parseInt(expiry)) return false;
    const expectedHmac = crypto.createHmac("sha256", TOKEN_SECRET).update(expiry).digest("hex");
    return hmac === expectedHmac;
  } catch {
    return false;
  }
}

async function getVisits() {
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }

  // Transform to match the expected format
  return data.map((row) => ({
    timestamp: row.created_at,
    ip: row.ip,
    page: row.page,
    referrer: row.referrer,
    entryReferrer: row.entry_referrer,
    entryPage: row.entry_page,
    utm: row.utm_source ? {
      source: row.utm_source,
      medium: row.utm_medium,
      campaign: row.utm_campaign,
    } : null,
    userAgent: row.user_agent,
    location: row.country ? {
      country: row.country,
      countryCode: row.country_code,
      region: row.region,
      city: row.city,
      zip: row.zip,
      lat: row.lat,
      lon: row.lon,
      timezone: row.timezone,
      isp: row.isp,
      org: row.org,
    } : null,
  }));
}

export async function POST(request: NextRequest) {
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };

  try {
    const body = await request.json();
    const { step, password, securityAnswer, token } = body;

    // Step 1: Verify password
    if (step === "password") {
      if (password === SECRET_PASSWORD) {
        return NextResponse.json({ success: true }, { headers });
      }
      return NextResponse.json({ error: "Invalid password" }, { status: 401, headers });
    }

    // Step 2: Verify security answer and return token + data
    if (step === "security") {
      if (password !== SECRET_PASSWORD) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401, headers });
      }
      if (securityAnswer?.toLowerCase().trim() !== SECRET_ANSWER.toLowerCase()) {
        return NextResponse.json({ error: "Invalid answer" }, { status: 401, headers });
      }
      
      const authToken = generateToken();
      const visits = await getVisits();
      
      return NextResponse.json({ token: authToken, visits }, { headers });
    }

    // Step 3: Fetch data with valid token
    if (step === "fetch") {
      if (!verifyToken(token)) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401, headers });
      }
      
      const visits = await getVisits();
      return NextResponse.json({ visits }, { headers });
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400, headers });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers });
  }
}
