import type { Metadata } from "next";
import {
  JetBrains_Mono,
  Montserrat,
  Playwrite_US_Trad,
} from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { DeferredAnalytics } from "@/components/analytics-deferred";
import { AppLinkProvider } from "@/components/app-link-provider";
import { AppShellLayout } from "@/components/app-shell-layout";
import { SwrProvider } from "@/components/swr-provider";
import { MatchaThemeProvider } from "@/components/theme/theme-provider";
import { routing } from "@/i18n/routing";
import {
  getMetadataBaseUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import { themeInitScript } from "@/lib/theme/theme-init-script";
import "../globals.css";
import "@/themes/matcha/matcha.css";
import "@/themes/matcha/registry-bridge.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const playwriteUsTrad = Playwrite_US_Trad({
  variable: "--font-playwrite-us-trad",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getMetadataBaseUrl()),
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
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      className={`${montserrat.variable} ${playwriteUsTrad.variable} ${jetbrainsMono.variable} h-full antialiased`}
      data-astryx-theme="matcha"
      lang={locale}
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: must run before first paint to prevent theme flash
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="flex h-dvh flex-col overflow-hidden">
        <NextIntlClientProvider>
          <AppLinkProvider>
            <MatchaThemeProvider>
              <SwrProvider>
                <AppShellLayout>{children}</AppShellLayout>
              </SwrProvider>
            </MatchaThemeProvider>
          </AppLinkProvider>
          <DeferredAnalytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
