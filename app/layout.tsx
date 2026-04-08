import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Madhavan Prasanna",
  description: "Personal site under reconstruction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

