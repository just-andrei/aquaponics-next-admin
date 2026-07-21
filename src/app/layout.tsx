import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Aquaponics",
  description:
    "Hybrid Power-Driven Aquaponics with IoT Environmental Control System.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `(() => {
    try {
      const storedTheme = localStorage.getItem("smart-aquaponics-theme");
      const systemTheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : systemTheme;
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (_) {
      document.documentElement.dataset.theme = "light";
    }
  })();`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
