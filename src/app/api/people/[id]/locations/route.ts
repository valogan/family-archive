import { NextRequest, NextResponse } from "next/server";
import { addLivedAt, removeLivedAt } from "@/lib/queries";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { location, date, moveIn, moveOut } = await req.json();
    if (!location) {
      return NextResponse.json({ error: "location is required" }, { status: 400 });
    }
    if (!date && !moveIn && !moveOut) {
      return NextResponse.json(
        { error: "at least one of date, moveIn, moveOut is required" },
        { status: 400 }
      );
    }
    const ok = await addLivedAt(id, location, { date, moveIn, moveOut });
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true }, { status: 201 });
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
    const { livedAtId } = await req.json();
    if (!livedAtId) {
      return NextResponse.json({ error: "livedAtId is required" }, { status: 400 });
    }
    const ok = await removeLivedAt(id, livedAtId);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
