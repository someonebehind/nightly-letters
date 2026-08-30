# 每晚一封信 (Nightly Letters)

一個匿名每日信件交換 App。

## 功能

- **21:00 提醒寫信**：每晚提示用戶寫一封信給陌生人
- **隨機寄出**：寫完後信件會隨機分配給另一位用戶
- **21:30 收信**：每晚收到一封來自隨機陌生人的信
- **完全匿名**：不需要真實姓名、電郵，只用本地生成的 UUID 識別
- **過往信件**：可以回看之前收到的信
- **PWA 支援**：可安裝到主畫面，支援瀏覽器通知（需用戶授權）

## 技術棧

- **Frontend / Backend**: Next.js 15 (App Router)
- **Database**: SQLite (better-sqlite3) — 單檔案，易於部署
- **UI**: Tailwind CSS + 夜色主題
- **語言**: 繁體中文（香港）為主

## 快速開始

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 打開 http://localhost:3000
```

首次運行會自動在 `data/letters.db` 建立資料庫。

## 部署建議

### Vercel（推薦）

1. Fork 或 push 此 repo 到 GitHub
2. 在 [Vercel](https://vercel.com) 匯入專案
3. **注意**：SQLite 在 serverless 環境有限制（檔案系統 ephemeral）。  
   生產環境建議改用：
   - [Turso](https://turso.tech) (libSQL，相容 better-sqlite3)
   - 或 PostgreSQL / Supabase
   - 或 PlanetScale / Neon

### 簡單 VPS / Railway / Render

直接 `npm run build && npm start` 即可，SQLite 會持久化。

## 使用流程

1. 打開 App → 自動產生匿名用戶 ID（存在 localStorage）
2. （可選）設定自己可見的暱稱
3. 開啟瀏覽器通知權限（可收到本地提醒）
4. 每晚 21:00 左右寫信 → 寄出
5. 21:30 後到「收信」頁刷新，系統會隨機配對一封其他用戶的信給你
6. 只有當日有寫信的用戶才有機會收到信（鼓勵參與）

## 配對邏輯

- 每日每個用戶最多寫一封
- 當用戶在「收信」時查詢：
  - 若當日已寫信且尚未收到 → 從當日未分配的信件中隨機選一封（排除自己）
  - 標記為已交付給該用戶
- 這樣形成近似 1:1 的隨機交換

## 通知說明

目前使用瀏覽器 Notification API + 頁面開啟時的 interval 檢查。  
真正的背景推送（即使 App 關閉）需要：

1. Service Worker
2. VAPID keys + Web Push
3. 後端在 21:00 / 21:30 觸發推送（可用 cron + 推送服務）

可以後續擴展。

## 目錄結構

```
src/
  app/
    api/
      user/route.ts      # 建立/取得用戶
      letters/route.ts   # 寫信 + 收信配對
    page.tsx             # 主介面（主頁 / 寫信 / 收信 / 過往）
    layout.tsx
    globals.css
  lib/
    db.ts                # SQLite 初始化
    utils.ts             # 日期/時間工具
data/                    # 自動產生 letters.db（gitignore）
```

## 開發者

用 GitHub 寫的匿名信件交換實驗專案。歡迎 fork、改造成真正的產品！

---

**理念**：在資訊爆炸的時代，留一點空間給陌生人寫一段真誠的話。
