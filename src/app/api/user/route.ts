import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const user = db
    .prepare("SELECT id, email, name, image, nickname, created_at FROM users WHERE id = ?")
    .get(session.user.id);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { nickname } = body;
    if (typeof nickname === "string") {
      db.prepare("UPDATE users SET nickname = ? WHERE id = ?").run(
        nickname.trim() || null,
        session.user.id
      );
    }
    return NextResponse.json({ success: true, nickname: nickname?.trim() || null });
  } catch (error) {
    console.error("User PATCH error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
