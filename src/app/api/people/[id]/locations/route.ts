import { NextRequest, NextResponse } from "next/server";
import { addLivedAt, removeLivedAt } from "@/lib/queries";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { location, date } = await req.json();
    if (!location || !date) {
      return NextResponse.json(
        { error: "location and date are required" },
        { status: 400 }
      );
    }
    const ok = await addLivedAt(id, location, date);
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
    const { location, date } = await req.json();
    if (!location || !date) {
      return NextResponse.json(
        { error: "location and date are required" },
        { status: 400 }
      );
    }
    await removeLivedAt(id, location, date);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
