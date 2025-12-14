import { NextResponse } from "next/server";
import { getAllPersonalPosts } from "@/lib/personal";

export async function GET() {
  const posts = getAllPersonalPosts();
  return NextResponse.json({ posts });
}

