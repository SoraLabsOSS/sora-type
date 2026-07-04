import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Playwrite_US_Trad } from "next/font/google";
import Script from "next/script";
import { MatchaThemeProvider } from "@/components/theme/theme-provider";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { THEME_STORAGE_KEY } from "@/lib/theme/constants";
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

const themeInitScript = `(function(){try{var m=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(m==="light"||m==="dark"){document.documentElement.setAttribute("data-theme",m);}}catch(e){}})();`;

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
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">
        <MatchaThemeProvider>{children}</MatchaThemeProvider>
      </body>
    </html>
  );
}
