import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Tracker from "@/components/Tracker";

export const metadata: Metadata = {
  title: "Madhavan Prasanna",
  description: "Personal portfolio and blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Z3VLYRKKTL"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Z3VLYRKKTL');
          `}
        </Script>
      </head>
      <body className="relative min-h-screen">
        <Tracker />
        <div className="relative z-10">
          <Header />
          <main className="max-w-2xl mx-auto px-6 py-12">{children}</main>
        </div>
      </body>
    </html>
  );
}

