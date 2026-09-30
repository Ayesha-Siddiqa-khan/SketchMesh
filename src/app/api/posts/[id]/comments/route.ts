import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

// GET /api/posts/:id/comments - Retrieve pinned comments for a specific canvas
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const comments = await prisma.comment.findMany({
      where: { postId: id },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/posts/:id/comments - Post a comment pinned to canvas coordinates
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { body: commentText, coordX, coordY } = body;

    if (!commentText || commentText.trim() === "") {
      return NextResponse.json(
        { error: "Comment text cannot be empty" },
        { status: 400 }
      );
    }

    const user = await getOrCreateDefaultUser();

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        authorId: user.id,
        body: commentText.slice(0, 500),
        coordX: typeof coordX === "number" ? coordX : null,
        coordY: typeof coordY === "number" ? coordY : null,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create comment" },
      { status: 500 }
    );
  }
}
