// Required when `app/not-found.tsx` exists at the root. Locale routes use
// `app/[locale]/layout.tsx` for html/body, fonts, and global styles.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
