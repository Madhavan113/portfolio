import type { Metadata } from "next";
import "./globals.css";
import Tracker from "@/components/Tracker";

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
      <body>
        <Tracker />
        {children}
      </body>
    </html>
  );
}

