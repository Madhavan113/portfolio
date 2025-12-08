import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

// Protected endpoint to fetch all analytics data
export async function GET(request: NextRequest) {
  // Auth check - only you can access this
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.ANALYTICS_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // List all visit files from blob storage
    const { blobs } = await list({
      prefix: "visits/",
      limit: 1000,
    });

    if (blobs.length === 0) {
      return NextResponse.json({ visits: [], total: 0 });
    }

    // Fetch all visit data
    const visits = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const res = await fetch(blob.url);
          const data = await res.json();
          return data;
        } catch {
          return null;
        }
      })
    );

    // Filter out nulls and sort by timestamp
    const validVisits = visits
      .filter((v) => v !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      total: validVisits.length,
      visits: validVisits,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

