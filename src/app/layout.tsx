import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RelayDesk - Aicoo-native Multi-Agent Support Network",
  description:
    "Aicoo-native multi-agent support and escalation network. Route requests faster, resolve with context, hand off cleanly across teams.",
  openGraph: {
    title: "RelayDesk - Aicoo-native Multi-Agent Support Network",
    description:
      "Aicoo-native multi-agent support and escalation network. Route requests faster, resolve with context, hand off cleanly across teams.",
    url: "https://relaydesk-two.vercel.app",
    siteName: "RelayDesk",
    images: [
      {
        url: "https://relaydesk-two.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "RelayDesk",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RelayDesk - Aicoo-native Multi-Agent Support Network",
    description:
      "Aicoo-native multi-agent support and escalation network. Route requests faster, resolve with context, hand off cleanly across teams.",
    images: ["https://relaydesk-two.vercel.app/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
