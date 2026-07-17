import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";
import { AccessProvider } from "../components/AccessProvider";
import { ContentProvider } from "../components/ContentProvider";
import { InputProvider } from "../components/InputProvider";
import { BlueprintsProvider } from "../components/BlueprintsProvider";
import { PhoneArchivesProvider } from "../components/PhoneArchivesProvider";
import { AppShell } from "../components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "数字学",
  description: "数字学",
  // iOS Safari's data detectors auto-link things that look like phone numbers /
  // dates (the chart digits), adding stray underlines that only show on iPhone.
  // Disabling format detection stops that.
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Redirect http→https as early as possible. GitHub Pages serves a valid
            cert, but until "Enforce HTTPS" can be enabled it doesn't auto-redirect,
            so an http visitor would sit on an insecure page with no padlock. This
            bounces them to https before anything else loads. Skips localhost so
            local dev over http still works. Becomes a no-op once GitHub's own
            redirect is active. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var l=window.location;if(l.protocol==='http:'&&l.hostname!=='localhost'&&l.hostname!=='127.0.0.1'){l.replace('https://'+l.host+l.pathname+l.search+l.hash)}}catch(e){}})()",
          }}
        />
        {/* Apply the saved theme before paint so dark users don't see a light flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <AccessProvider>
            <ContentProvider>
              <BlueprintsProvider>
                <PhoneArchivesProvider>
                  <InputProvider>
                    <AppShell>{children}</AppShell>
                  </InputProvider>
                </PhoneArchivesProvider>
              </BlueprintsProvider>
            </ContentProvider>
          </AccessProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
