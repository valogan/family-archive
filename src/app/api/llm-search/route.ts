import { NextRequest, NextResponse } from "next/server";
import { conversationalSearch } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    const result = await conversationalSearch(message);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}