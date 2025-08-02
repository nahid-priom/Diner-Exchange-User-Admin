// /app/api/user/upload/route.js

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
export const runtime = "edge";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // File name: original + timestamp for uniqueness
  const filename =
    file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "") +
    "_" +
    Date.now();

  // Upload to Vercel Blob storage
  const blob = await put(filename, file, { access: "public" });

  return NextResponse.json({ url: blob.url }, { status: 200 });
}
