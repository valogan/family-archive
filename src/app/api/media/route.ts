import { NextRequest, NextResponse } from "next/server";
import { createMedia, getAllMedia, searchMedia, linkPersonToMedia } from "@/lib/queries";
import { queuePersonSummary } from "@/lib/llm";
import { writeFile, mkdir } from "fs/promises";
import { v4 as uuid } from "uuid";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const location = formData.get("location") as string | null;
    const dateTaken = formData.get("dateTaken") as string | null;
    const personIdsRaw = formData.get("personIds") as string | null;
    const personIds = personIdsRaw ? JSON.parse(personIdsRaw) : [];

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadDir = process.env.UPLOAD_DIR || "./src/uploads";
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || ".bin";
    const filename = `${uuid()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const media = await createMedia({
      filename,
      originalName: file.name,
      mimeType: file.type,
      path: `/uploads/${filename}`,
      location: location || undefined,
      dateTaken: dateTaken || undefined,
    });

    for (const personId of personIds) {
      await linkPersonToMedia(personId, media.id);
    }
    for (const personId of personIds) {
      queuePersonSummary(personId);
    }

    return NextResponse.json(media, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const location = url.searchParams.get("location");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    if (search || location || dateFrom || dateTo) {
      const media = await searchMedia(search || "", location || undefined, dateFrom || undefined, dateTo || undefined);
      return NextResponse.json(media);
    }

    const media = await getAllMedia();
    return NextResponse.json(media);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}