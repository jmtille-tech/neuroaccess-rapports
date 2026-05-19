import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroAccess — Rapports",
  description: "Plateforme de diagnostic expérience visiteur",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d1520" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NeuroAccess" />
        <link rel="apple-touch-icon" href="/ben.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}