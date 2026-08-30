# 每晚一封信 (Nightly Letters)

一個匿名每日信件交換 App，**必須用 Google 登入**。

## 功能

- **Google 登入**：用 Gmail 帳戶登入（NextAuth + Google OAuth）
- **21:00 提醒寫信**：每晚提示用戶寫一封信給陌生人
- **隨機寄出**：寫完後信件會隨機分配給另一位用戶
- **21:30 收信**：每晚收到一封來自隨機陌生人的信
- **匿名信件**：信件只顯示可選署名（pen name），唔會公開電郵或真實姓名
- **過往信件**：可以回看之前收到的信
- **PWA 支援**：可安裝到主畫面

## 技術棧

- Next.js 15 (App Router)
- NextAuth.js v5 (Google Provider)
- SQLite (better-sqlite3)
- Tailwind CSS

## 設定 Google OAuth

1. 去 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 建立 OAuth 2.0 Client ID（Web application）
3. Authorized redirect URIs 加入：
   - `http://localhost:3000/api/auth/callback/google`（開發）
   - `https://你的網域/api/auth/callback/google`（正式）
4. 複製 Client ID 同 Client Secret

## 快速開始

```bash
cp .env.example .env.local
# 編輯 .env.local 填入 GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET、NEXTAUTH_SECRET

npm install
npm run dev
```

打開 http://localhost:3000 → 會見到「用 Google 登入」按鈕。

## 環境變數

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=用 openssl rand -base64 32 生成
```

## 使用流程

1. 用 Google 登入
2. （可選）設定自己可見的暱稱
3. 開啟瀏覽器通知權限
4. 每晚 21:00 左右寫信 → 寄出
5. 21:30 後到「收信」頁刷新，系統會隨機配對一封其他用戶的信給你
6. 只有當日有寫信的用戶才有機會收到信

## 注意

- 信件內容完全匿名，對方只見到你寫的署名（如果有）
- Google 電郵只用於身份驗證，唔會顯示畀其他用戶
