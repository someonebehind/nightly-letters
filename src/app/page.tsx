"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { format } from "date-fns";
import { zhHK } from "date-fns/locale";

interface LetterData {
  hasWrittenToday: boolean;
  myLetter: { id: string; content: string; penName: string | null; createdAt: string } | null;
  receivedToday: {
    id: string;
    content: string;
    penName: string | null;
    createdAt: string;
    deliveredAt: string;
  } | null;
  history: Array<{
    id: string;
    content: string;
    penName: string | null;
    createdAt: string;
    deliveredAt: string;
    letter_date: string;
  }>;
}

type Tab = "home" | "write" | "inbox" | "history";

export default function Home() {
  const { data: session, status } = useSession();
  const [nickname, setNickname] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [letterData, setLetterData] = useState<LetterData | null>(null);
  const [content, setContent] = useState("");
  const [penName, setPenName] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [now, setNow] = useState(new Date());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (session?.user?.nickname) {
      setNickname(session.user.nickname);
    } else if (session?.user?.name) {
      setNickname(session.user.name.split(" ")[0]);
    }
  }, [session]);

  const loadLetters = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/letters");
      if (res.status === 401) return;
      const data = await res.json();
      setLetterData(data);
    } catch (e) {
      console.error(e);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated") {
      loadLetters();
    }
  }, [status, loadLetters]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotification = async () => {
    if (!("Notification" in window)) {
      alert("你嘅瀏覽器唔支援通知");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      new Notification("Nightly Letters", {
        body: "已開啟通知！每晚 21:00 會提醒你寫信，21:30 提醒收信。",
        icon: "/icon-192.png",
      });
    }
  };

  const handleSaveNickname = async () => {
    if (!session?.user?.id) return;
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      setMessage({ type: "success", text: "暱稱已儲存" });
    } catch {
      setMessage({ type: "error", text: "儲存失敗" });
    }
  };

  const handleSend = async () => {
    if (!session?.user?.id || content.trim().length < 10) {
      setMessage({ type: "error", text: "請至少寫 10 個字" });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, penName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "發送失敗" });
      } else {
        setMessage({ type: "success", text: data.message });
        setContent("");
        setPenName("");
        await loadLetters();
        setTab("home");
      }
    } catch {
      setMessage({ type: "error", text: "網絡錯誤，請重試" });
    } finally {
      setSending(false);
    }
  };

  const hour = now.getHours();
  const minute = now.getMinutes();
  const isNearWrite = hour === 20 || (hour === 21 && minute < 30);
  const isReceiveWindow = hour > 21 || (hour === 21 && minute >= 30);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🌙</div>
          <p className="text-purple-200">載入中...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">🌙</div>
          <h1 className="text-3xl font-bold text-purple-100 mb-3">每晚一封信</h1>
          <p className="text-purple-300 mb-8 leading-relaxed">
            每晚 21:00 寫一封信給陌生人
            <br />
            21:30 收到一封隨機來信
            <br />
            <span className="text-sm text-purple-400">完全匿名 · 用 Google 登入即可開始</span>
          </p>
          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-gray-800 font-semibold text-lg shadow-xl hover:bg-gray-100 active:scale-[0.98] transition"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            用 Google 登入
          </button>
          <p className="mt-6 text-xs text-purple-500">
            登入後只會用嚟識別身份，信件內容完全匿名，唔會公開你嘅電郵
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-night-950/80 backdrop-blur-md border-b border-purple-900/40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-purple-100 tracking-wide">每晚一封信</h1>
            <p className="text-xs text-purple-400">
              {format(now, "yyyy年M月d日 HH:mm:ss", { locale: zhHK })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {session.user?.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full border border-purple-600"
              />
            )}
            <div className="text-right text-sm text-purple-300">
              {nickname || session.user?.name || "用戶"}
            </div>
            <button
              onClick={() => signOut()}
              className="text-xs text-purple-500 hover:text-purple-300"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-sm ${
              message.type === "success"
                ? "bg-emerald-900/40 text-emerald-200 border border-emerald-700/50"
                : "bg-red-900/40 text-red-200 border border-red-700/50"
            }`}
          >
            {message.text}
          </div>
        )}

        {tab === "home" && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">
                {isNearWrite ? "✍️" : isReceiveWindow ? "💌" : "🌙"}
              </div>
              <h2 className="text-2xl font-semibold text-purple-100 mb-2">
                {isNearWrite
                  ? "係時候寫信喇"
                  : isReceiveWindow
                  ? "今晚嘅信到喇"
                  : "夜晚靜靜等"}
              </h2>
              <p className="text-purple-300 text-sm leading-relaxed max-w-xs mx-auto">
                {isNearWrite
                  ? "寫下你今日想同陌生人講嘅說話。寫完後會隨機寄出。"
                  : isReceiveWindow
                  ? letterData?.receivedToday
                    ? "你收到一封來自陌生人嘅信。"
                    : letterData?.hasWrittenToday
                    ? "信仲喺路上... 可能其他用戶都未寫完，請稍後再刷新。"
                    : "你今晚未寫信，唔會收到回信。去寫一封先！"
                  : "每晚 21:00 寫信，21:30 收信。保持匿名，分享真心。"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-night-900/60 rounded-2xl p-4 border border-purple-800/40">
                <div className="text-xs text-purple-400 mb-1">今日寫信</div>
                <div className="text-lg font-medium text-purple-100">
                  {letterData?.hasWrittenToday ? "✅ 已寫" : "⏳ 未寫"}
                </div>
              </div>
              <div className="bg-night-900/60 rounded-2xl p-4 border border-purple-800/40">
                <div className="text-xs text-purple-400 mb-1">今日收信</div>
                <div className="text-lg font-medium text-purple-100">
                  {letterData?.receivedToday ? "💌 已收到" : "📭 未有"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {!letterData?.hasWrittenToday && (
                <button
                  onClick={() => setTab("write")}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold text-lg shadow-lg shadow-purple-900/40 active:scale-[0.98] transition"
                >
                  寫今晚的信
                </button>
              )}
              {letterData?.receivedToday && (
                <button
                  onClick={() => setTab("inbox")}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg shadow-lg shadow-indigo-900/40 active:scale-[0.98] transition"
                >
                  打開今晚的信
                </button>
              )}
              {letterData?.hasWrittenToday && !letterData?.receivedToday && (
                <button
                  onClick={loadLetters}
                  className="w-full py-3 rounded-2xl bg-night-800 text-purple-200 border border-purple-700/50"
                >
                  刷新收信狀態
                </button>
              )}
            </div>

            {notifPermission !== "granted" && (
              <div className="mt-8 p-4 rounded-2xl bg-night-900/50 border border-purple-800/30 text-center">
                <p className="text-sm text-purple-300 mb-3">
                  開啟通知，每晚自動提醒你寫信同收信
                </p>
                <button
                  onClick={requestNotification}
                  className="px-5 py-2 rounded-full bg-purple-700/60 text-purple-100 text-sm"
                >
                  開啟通知權限
                </button>
              </div>
            )}

            <div className="mt-6 p-4 rounded-2xl bg-night-900/40 border border-purple-900/30">
              <label className="text-xs text-purple-400 block mb-2">
                你的暱稱（可選，僅自己可見）
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="例如：夜行人"
                  className="flex-1 bg-night-950 border border-purple-800/50 rounded-xl px-3 py-2 text-sm text-purple-100 placeholder-purple-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSaveNickname}
                  className="px-4 py-2 rounded-xl bg-purple-800/60 text-purple-100 text-sm"
                >
                  儲存
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "write" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-purple-100">寫一封信</h2>
              <button onClick={() => setTab("home")} className="text-purple-400 text-sm">
                返回
              </button>
            </div>
            <p className="text-sm text-purple-400">
              這封信會在今晚隨機寄給另一位用戶。保持真誠，不要寫個人聯絡方式。
            </p>
            <div className="letter-paper rounded-2xl p-5 min-h-[320px] flex flex-col">
              <input
                type="text"
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                placeholder="署名（可選，例如：一個失眠的人）"
                className="w-full mb-3 text-sm border-b border-amber-200/60 pb-2 focus:outline-none"
                maxLength={30}
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="親愛的陌生人，\n\n今日我想同你分享..."
                className="flex-1 w-full text-base leading-relaxed focus:outline-none min-h-[220px]"
                maxLength={2000}
              />
              <div className="text-right text-xs text-stone-500 mt-2">
                {content.length}/2000
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || content.trim().length < 10}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {sending ? "寄出中..." : "寄出這封信 ✉️"}
            </button>
            {letterData?.hasWrittenToday && (
              <p className="text-center text-sm text-amber-300/80">
                你今日已經寫過一封信喇。
              </p>
            )}
          </div>
        )}

        {tab === "inbox" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-purple-100">今晚的信</h2>
              <button onClick={() => setTab("home")} className="text-purple-400 text-sm">
                返回
              </button>
            </div>
            {letterData?.receivedToday ? (
              <div className="letter-paper rounded-2xl p-6">
                <div className="text-xs text-stone-500 mb-4">
                  來自：{letterData.receivedToday.penName || "一位陌生人"}
                  <br />
                  寄出時間：
                  {format(new Date(letterData.receivedToday.createdAt), "HH:mm")}
                </div>
                <div className="whitespace-pre-wrap text-base leading-relaxed text-stone-800">
                  {letterData.receivedToday.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-purple-300">
                <div className="text-5xl mb-4">📭</div>
                <p>今晚還沒有收到信</p>
                <p className="text-sm mt-2 text-purple-400">
                  {letterData?.hasWrittenToday
                    ? "可能其他用戶還在寫，稍後刷新試試"
                    : "你今晚還沒寫信，去寫一封才能收到回信"}
                </p>
                <button
                  onClick={loadLetters}
                  className="mt-6 px-6 py-2 rounded-full bg-purple-800/50 text-purple-200"
                >
                  刷新
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-purple-100">過往來信</h2>
              <button onClick={() => setTab("home")} className="text-purple-400 text-sm">
                返回
              </button>
            </div>
            {letterData?.history && letterData.history.length > 0 ? (
              <div className="space-y-4">
                {letterData.history.map((l) => (
                  <div key={l.id} className="letter-paper rounded-xl p-4">
                    <div className="text-xs text-stone-500 mb-2">
                      {l.letter_date} · {l.penName || "陌生人"}
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800 line-clamp-6">
                      {l.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-purple-300">
                <div className="text-5xl mb-4">📜</div>
                <p>還沒有過往信件</p>
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-night-950/90 backdrop-blur-md border-t border-purple-900/40">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {[
            { id: "home" as Tab, label: "主頁", icon: "🌙" },
            { id: "write" as Tab, label: "寫信", icon: "✍️" },
            { id: "inbox" as Tab, label: "收信", icon: "💌" },
            { id: "history" as Tab, label: "過往", icon: "📜" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center px-4 py-2 rounded-xl transition ${
                tab === item.id ? "text-purple-200" : "text-purple-500"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
