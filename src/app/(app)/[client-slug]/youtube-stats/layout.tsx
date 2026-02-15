import Script from "next/script";

export default function YouTubeStatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
      />
      {children}
    </>
  );
}
