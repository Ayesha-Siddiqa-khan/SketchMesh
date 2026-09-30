import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";
import { uploadThumbnail } from "@/lib/s3";

// GET /api/posts - Paginated discovery feed with filters (Trending, Most Recent, Most Remixed)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "recent"; // 'trending' | 'recent' | 'remixed'
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);
  const skip = (page - 1) * limit;

  let orderBy: any = { createdAt: "desc" };
  if (filter === "trending") {
    orderBy = [{ likesCount: "desc" }, { viewsCount: "desc" }];
  } else if (filter === "remixed") {
    orderBy = { remixes: { _count: "desc" } };
  }

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
          forkedFrom: {
            select: {
              id: true,
              title: true,
              author: { select: { username: true } },
            },
          },
          _count: {
            select: { remixes: true, comments: true },
          },
        },
      }),
      prisma.post.count(),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    // If DB is not connected yet, deliver initial curated mock items for interactive demo
    return NextResponse.json({
      posts: [
        {
          id: "seed-microservices-topology",
          title: "Cloud-Native Event-Driven Topology",
          content: "Comprehensive microservices breakdown with Kafka streaming, Redis read cache, and resilient outbox patterns.",
          thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
          author: { id: "usr_alex", username: "alex_architect", avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=alex" },
          forkedFrom: null,
          likesCount: 142,
          viewsCount: 1890,
          _count: { remixes: 24, comments: 8 },
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: "seed-design-system-spec",
          title: "Fluid Design System Tokens & Hierarchy",
          content: "Component specification matrix and design token inheritance schema across dark and light palettes.",
          thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
          author: { id: "usr_sarah", username: "sarah_ui", avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=sarah" },
          forkedFrom: { id: "seed-microservices-topology", title: "Cloud-Native Topology", author: { username: "alex_architect" } },
          likesCount: 89,
          viewsCount: 920,
          _count: { remixes: 12, comments: 4 },
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
      ],
      pagination: { page: 1, limit: 12, total: 2, totalPages: 1 },
      mock: true,
    });
  }
}

// POST /api/posts - Create post with canvas JSON and thumbnail
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, sketchData, thumbnailBase64, forkedFromId } = body;

    if (!title || !sketchData) {
      return NextResponse.json(
        { error: "Title and sketch canvas data are required" },
        { status: 400 }
      );
    }

    const user = await getOrCreateDefaultUser();

    let thumbnailUrl = body.thumbnailUrl;
    if (thumbnailBase64) {
      // Decode base64 image and send to S3/MinIO
      const matches = thumbnailBase64.match(/^data:(.+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : "image/png";
      const buffer = Buffer.from(matches ? matches[2] : thumbnailBase64, "base64");
      thumbnailUrl = await uploadThumbnail(buffer, `sketch-${Date.now()}.png`, mimeType);
    }

    if (!thumbnailUrl) {
      thumbnailUrl = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80";
    }

    const newPost = await prisma.post.create({
      data: {
        title,
        content: content || "",
        sketchData,
        thumbnailUrl,
        authorId: user.id,
        forkedFromId: forkedFromId || null,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        forkedFrom: {
          select: {
            id: true,
            title: true,
            author: { select: { username: true } },
          },
        },
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
