import { NextRequest, NextResponse } from "next/server";
import { getPerson } from "@/lib/queries";
import { generatePersonSummary } from "@/lib/llm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const person = await getPerson(id);
    if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const summary = await generatePersonSummary(person);
    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
