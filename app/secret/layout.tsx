// Force dynamic rendering - never cache this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SecretLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

