import { NextRequest, NextResponse } from "next/server";
import { tagPersonInMedia, untagPersonInMedia } from "@/lib/queries";

const isFraction = (v: any) => typeof v === "number" && v >= 0 && v <= 1;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { personId, x, y, w, h } = await req.json();
    if (!personId || !isFraction(x) || !isFraction(y) || !isFraction(w) || !isFraction(h)) {
      return NextResponse.json(
        { error: "personId and x/y/w/h fractions (0-1) are required" },
        { status: 400 }
      );
    }
    const ok = await tagPersonInMedia(personId, id, { x, y, w, h });
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
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
    const { personId } = await req.json();
    if (!personId) {
      return NextResponse.json({ error: "personId is required" }, { status: 400 });
    }
    const ok = await untagPersonInMedia(personId, id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
