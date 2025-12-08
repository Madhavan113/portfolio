import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_SECRET_PASSWORD || "madhavan2025";
const SECURITY_ANSWER = process.env.NEXT_PUBLIC_SECURITY_ANSWER || "chess";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { p, s } = body;

    // Double authentication check
    if (p !== CORRECT_PASSWORD || s.toLowerCase().trim() !== SECURITY_ANSWER.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch visits from blob storage
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

    const validVisits = visits
      .filter((v) => v !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ visits: validVisits });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

