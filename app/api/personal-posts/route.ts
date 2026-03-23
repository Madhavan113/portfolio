import { NextRequest, NextResponse } from "next/server";
import { getAllPersonalPosts } from "@/lib/personal";

// Never cache or prerender this route.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// The answer is server-side only, never sent to client
const PERSONAL_ANSWER = process.env.PERSONAL_ANSWER || "shiba";

export async function GET() {
  const posts = getAllPersonalPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answer } = body;
    
    if (typeof answer !== "string") {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    
    const normalizedAnswer = answer.toLowerCase().trim().replace(/\s+/g, "");
    const expectedAnswer = PERSONAL_ANSWER.toLowerCase().trim().replace(/\s+/g, "");
    
    if (normalizedAnswer === expectedAnswer) {
      const posts = getAllPersonalPosts();
      return NextResponse.json({ success: true, posts });
    }
    
    return NextResponse.json({ success: false }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
