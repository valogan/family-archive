import { NextRequest, NextResponse } from "next/server";
import { fullSearch, advancedSearch } from "@/lib/queries";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("query");
    const location = url.searchParams.get("location");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const personIds = url.searchParams.getAll("personIds");

    if (location || dateFrom || dateTo || personIds.length > 0) {
      const result = await advancedSearch({
        query: query || undefined,
        location: location || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        personIds: personIds.length > 0 ? personIds : undefined,
      });
      return NextResponse.json(result);
    }

    const result = await fullSearch(query || "");
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}