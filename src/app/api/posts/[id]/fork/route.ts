import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

// POST /api/posts/:id/fork - Clone existing sketch into personal draft studio
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const parentPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!parentPost) {
      return NextResponse.json({ error: "Upstream post not found" }, { status: 404 });
    }

    const currentUser = await getOrCreateDefaultUser();

    // Clone into new post with upstream attribution
    const forkedPost = await prisma.post.create({
      data: {
        title: `Remix of: ${parentPost.title}`,
        content: parentPost.content,
        sketchData: parentPost.sketchData as any,
        thumbnailUrl: parentPost.thumbnailUrl,
        authorId: currentUser.id,
        forkedFromId: parentPost.id,
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

    return NextResponse.json(forkedPost, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fork post" },
      { status: 500 }
    );
  }
}
