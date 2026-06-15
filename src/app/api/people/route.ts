import { NextRequest, NextResponse } from "next/server";
import {
  createPerson,
  getAllPeople,
  searchPeople,
} from "@/lib/queries";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const person = await createPerson(body);
    return NextResponse.json(person, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    if (search) {
      const people = await searchPeople(search);
      return NextResponse.json(people);
    }
    const people = await getAllPeople();
    return NextResponse.json(people);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}