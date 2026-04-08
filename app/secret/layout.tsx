// Force dynamic rendering - never cache this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SecretLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-12">{children}</main>;
}

