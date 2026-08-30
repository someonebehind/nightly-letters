import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nightly Letters | 每晚一封信",
  description: "每晚21:00寫信給陌生人，21:30收到一封隨機陌生人的信。Anonymous daily letter exchange.",
  manifest: "/manifest.json",
  themeColor: "#1a1030",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nightly Letters",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased night-bg">{children}</body>
    </html>
  );
}
