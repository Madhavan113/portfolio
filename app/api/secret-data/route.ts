import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
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
  const { blobs } = await list({ prefix: "visits/", limit: 1000 });

  const visits = await Promise.all(
    blobs.map(async (blob) => {
      try {
        const res = await fetch(blob.url);
        return await res.json();
      } catch {
        return null;
      }
    })
  );

  return visits
    .filter((v) => v !== null)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
