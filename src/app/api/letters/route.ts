import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";
import { getTodayDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, content, penName } = body;

    if (!userId || !content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "userId and content (min 10 chars) required" },
        { status: 400 }
      );
    }

    // Ensure user exists
    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found. Please refresh." }, { status: 404 });
    }

    const today = getTodayDate();

    // Check if already wrote today
    const existing = db
      .prepare("SELECT id FROM letters WHERE user_id = ? AND letter_date = ?")
      .get(userId, today);
    if (existing) {
      return NextResponse.json(
        { error: "你今日已經寫過信喇！每晚只可以寫一封。" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    db.prepare(
      `INSERT INTO letters (id, user_id, content, pen_name, letter_date)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, userId, content.trim(), penName?.trim() || null, today);

    return NextResponse.json({
      success: true,
      letterId: id,
      message: "信已經寄出！今晚 21:30 你會收到一封陌生人嘅信。",
    });
  } catch (error) {
    console.error("Letters POST error:", error);
    return NextResponse.json({ error: "Failed to send letter" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const today = getTodayDate();

  // Check if user wrote today
  const myLetter = db
    .prepare("SELECT id, content, pen_name, created_at FROM letters WHERE user_id = ? AND letter_date = ?")
    .get(userId, today) as
    | { id: string; content: string; pen_name: string | null; created_at: string }
    | undefined;

  // Check if already received today
  let received = db
    .prepare(
      `SELECT l.id, l.content, l.pen_name, l.created_at, l.delivered_at
       FROM letters l
       WHERE l.delivered_to = ? AND l.letter_date = ?`
    )
    .get(userId, today) as
    | {
        id: string;
        content: string;
        pen_name: string | null;
        created_at: string;
        delivered_at: string;
      }
    | undefined;

  // If not received yet and it's receive time (or for demo always try), assign one
  if (!received && myLetter) {
    // Find a random undelivered letter from today, not from self
    const available = db
      .prepare(
        `SELECT id FROM letters
         WHERE letter_date = ? AND delivered_to IS NULL AND user_id != ?
         ORDER BY RANDOM() LIMIT 1`
      )
      .get(today, userId) as { id: string } | undefined;

    if (available) {
      const now = new Date().toISOString();
      db.prepare(
        `UPDATE letters SET delivered_to = ?, delivered_at = ? WHERE id = ?`
      ).run(userId, now, available.id);

      received = db
        .prepare(
          `SELECT id, content, pen_name, created_at, delivered_at
           FROM letters WHERE id = ?`
        )
        .get(available.id) as typeof received;
    }
  }

  // Also get past received letters (history)
  const history = db
    .prepare(
      `SELECT id, content, pen_name, created_at, delivered_at, letter_date
       FROM letters
       WHERE delivered_to = ? AND letter_date != ?
       ORDER BY delivered_at DESC
       LIMIT 20`
    )
    .all(userId, today) as Array<{
    id: string;
    content: string;
    pen_name: string | null;
    created_at: string;
    delivered_at: string;
    letter_date: string;
  }>;

  return NextResponse.json({
    hasWrittenToday: !!myLetter,
    myLetter: myLetter
      ? { id: myLetter.id, content: myLetter.content, penName: myLetter.pen_name, createdAt: myLetter.created_at }
      : null,
    receivedToday: received
      ? {
          id: received.id,
          content: received.content,
          penName: received.pen_name,
          createdAt: received.created_at,
          deliveredAt: received.delivered_at,
        }
      : null,
    history,
  });
}
