import { NextRequest, NextResponse } from "next/server";
import { addLifeEvent, removeLifeEvent } from "@/lib/queries";
import { queuePersonSummary } from "@/lib/llm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { label, date } = await req.json();
    if (!label || typeof label !== "string" || !label.trim()) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }
    const event = await addLifeEvent(id, label.trim(), date);
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    queuePersonSummary(id);
    return NextResponse.json(event, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { eventId } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }
    const ok = await removeLifeEvent(id, eventId);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    queuePersonSummary(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
