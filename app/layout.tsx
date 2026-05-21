import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://goatin-ascension.vercel.app"),
  title: "GOATin Ascension Generator",
  description: "Enter your GOATin into the legendary Order and reveal its warrior identity.",
  openGraph: {
    title: "GOATin Ascension Generator",
    description: "The Mountain Calls.",
    images: ["/images/mountain-order.png"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090807"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
