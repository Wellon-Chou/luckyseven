import { type ReactNode } from "react";
import { SectionNav } from "./SectionNav";
import { AccountMenu } from "./AccountMenu";
import { ThemeToggle } from "./ThemeToggle";
import { AuthModal } from "./AuthModal";

// Shared page chrome: gradient background, floating nav / account / theme
// controls, the auth modal, and the title header. Page content (the sections)
// is rendered as `children` inside <main>.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-b from-amber-100 to-amber-50 font-sans">
      <SectionNav />
      <AccountMenu />
      <ThemeToggle />
      <AuthModal />
      <main className="flex flex-1 w-full max-w-6xl flex-col gap-10 pt-20 pb-32 px-4 sm:px-8 lg:px-16">
        <header className="title-container w-full flex-col items-start gap-2 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-100 to-white px-6 py-8 text-left shadow-sm ring-1 ring-amber-100/50 sm:px-8 sm:py-10">
          <h1 className="title">天数字学数姿艺</h1>
          <p className="text-base text-amber-800/80">生命灵数 · 个人命盘解析</p>
        </header>
        {children}
      </main>
    </div>
  );
}
