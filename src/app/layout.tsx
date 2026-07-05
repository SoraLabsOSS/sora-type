import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Playwrite_US_Trad } from "next/font/google";
import { AppLinkProvider } from "@/components/app-link-provider";
import { AppShellLayout } from "@/components/app-shell-layout";
import { MatchaThemeProvider } from "@/components/theme/theme-provider";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { themeInitScript } from "@/lib/theme/theme-init-script";
import "./globals.css";
import "@/themes/matcha/matcha.css";
import "@/themes/matcha/registry-bridge.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const playwriteUsTrad = Playwrite_US_Trad({
  variable: "--font-playwrite-us-trad",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: `%s · ${SITE_NAME}`,
    default: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${dmSans.variable} ${playwriteUsTrad.variable} ${jetbrainsMono.variable} h-full antialiased`}
      data-astryx-theme="matcha"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: must run before first paint to prevent theme flash
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="flex h-dvh flex-col overflow-hidden">
        <AppLinkProvider>
          <MatchaThemeProvider>
            <AppShellLayout>{children}</AppShellLayout>
          </MatchaThemeProvider>
        </AppLinkProvider>
      </body>
    </html>
  );
}
