import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Достижения — Платформа достижений лицея",
  description: "Telegram Mini App для отслеживания достижений учеников лицея",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#08080f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[#08080f] text-foreground">
        {children}
        <Toaster theme="dark" />
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.Telegram ||= {};
              console.log('[TG] WebApp script loading strategy: beforeInteractive');
            `,
          }}
        />
      </body>
    </html>
  );
}
