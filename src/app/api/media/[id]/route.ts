import { NextRequest, NextResponse } from "next/server";
import { getMedia } from "@/lib/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const media = await getMedia(id);
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(media);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}