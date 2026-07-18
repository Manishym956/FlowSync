import type { Metadata } from "next";
import "./globals.css";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";

export const metadata: Metadata = {
  title: {
    default: "FlowSync — Data Integration Platform",
    template: "%s | FlowSync",
  },
  description:
    "FlowSync is a multi-system data integration and automation platform that connects APIs, synchronizes data, and automates workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
