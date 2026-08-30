import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, nickname } = body;

    if (userId) {
      // Check if exists
      const existing = db.prepare("SELECT id, nickname FROM users WHERE id = ?").get(userId) as
        | { id: string; nickname: string | null }
        | undefined;
      if (existing) {
        if (nickname && nickname !== existing.nickname) {
          db.prepare("UPDATE users SET nickname = ? WHERE id = ?").run(nickname, userId);
        }
        return NextResponse.json({ userId: existing.id, nickname: nickname || existing.nickname });
      }
    }

    // Create new user
    const newId = userId || uuidv4();
    db.prepare("INSERT INTO users (id, nickname) VALUES (?, ?)").run(newId, nickname || null);
    return NextResponse.json({ userId: newId, nickname: nickname || null });
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json({ error: "Failed to create/get user" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const user = db.prepare("SELECT id, nickname, created_at FROM users WHERE id = ?").get(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}
