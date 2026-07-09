import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";
import {
  JetBrains_Mono,
  Montserrat,
  Playwrite_US_Trad,
} from "next/font/google";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { themeInitScript } from "@/lib/theme/theme-init-script";
import "./globals.css";
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

const NOT_FOUND_SECTION_CLASS = [
  "flex min-h-dvh flex-col items-center justify-center px-4 py-4",
  "[&>div]:flex [&>div]:flex-col [&>div]:items-center [&>div]:justify-center",
].join(" ");

/** Non-localized 404s (routes the i18n middleware does not match). */
export default async function RootNotFound() {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: "common.notFound",
  });

  return (
    <html
      className={`${montserrat.variable} ${playwriteUsTrad.variable} ${jetbrainsMono.variable} h-full antialiased`}
      data-astryx-theme="matcha"
      lang={routing.defaultLocale}
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: must run before first paint to prevent theme flash
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <Section
          className={NOT_FOUND_SECTION_CLASS}
          padding={0}
          variant="transparent"
        >
          <VStack className="text-center" gap={4} hAlign="center">
            <Heading
              className="font-heading font-normal text-8xl leading-none tracking-tight"
              level={1}
            >
              {t("title")}
            </Heading>
            <Text color="secondary" type="body">
              {t("description")}
            </Text>
            <Button href="/" label={t("backHome")} variant="primary" />
          </VStack>
        </Section>
      </body>
    </html>
  );
}
