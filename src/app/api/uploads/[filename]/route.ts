import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const uploadDir = process.env.UPLOAD_DIR || "./src/uploads";
  const filePath = path.join(uploadDir, filename);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = await readFile(filePath);
  const ext = path.extname(filename).toLowerCase();

  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
  };

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}