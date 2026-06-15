import { NextRequest, NextResponse } from "next/server";
import { createRelationship, deleteRelationship, getRelationships } from "@/lib/queries";

export async function POST(req: NextRequest) {
  try {
    const { fromId, toId, type } = await req.json();
    const success = await createRelationship(fromId, toId, type);
    if (!success) return NextResponse.json({ error: "Invalid relationship type" }, { status: 400 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const personId = url.searchParams.get("personId");
    if (!personId) {
      return NextResponse.json({ error: "personId required" }, { status: 400 });
    }
    const relationships = await getRelationships(personId);
    return NextResponse.json(relationships);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { fromId, toId, type } = await req.json();
    await deleteRelationship(fromId, toId, type);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}