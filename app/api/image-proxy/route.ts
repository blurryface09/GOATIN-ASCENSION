import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ message: "Image URL is required." }, { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ message: "Image URL is invalid." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(imageUrl.protocol)) {
    return NextResponse.json({ message: "Only HTTP image URLs are allowed." }, { status: 400 });
  }

  const response = await fetch(imageUrl, {
    headers: {
      accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8"
    },
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    return NextResponse.json({ message: "Image could not be fetched." }, { status: 502 });
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600, s-maxage=86400",
      "access-control-allow-origin": "*"
    }
  });
}
