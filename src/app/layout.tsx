import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";
import { AccessProvider } from "../components/AccessProvider";
import { ContentProvider } from "../components/ContentProvider";
import { InputProvider } from "../components/InputProvider";
import { BlueprintsProvider } from "../components/BlueprintsProvider";
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
                <InputProvider>
                  <AppShell>{children}</AppShell>
                </InputProvider>
              </BlueprintsProvider>
            </ContentProvider>
          </AccessProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
