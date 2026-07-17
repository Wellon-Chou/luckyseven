'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccessLevel } from "./AccessProvider";
import { useStartSubscribe } from "./useStartSubscribe";
import { useAuth } from "./AuthProvider";
import { useInput } from "./InputProvider";
import { useBlueprints, type Blueprint } from "./BlueprintsProvider";
import { usePhoneArchives, type PhoneArchive } from "./PhoneArchivesProvider";

// Pages (top-level nav) and the in-page section anchors for each.
// minLevel = subscription tier needed to open the page (0 free · 1 standard · 2 premium).
const PAGES = [
  {
    href: "/",
    label: "个人蓝图",
    minLevel: 0,
    sections: [
      { id: "sec-input", label: "核心资料" },
      { id: "sec-chart", label: "个人蓝图" },
      { id: "sec-summary", label: "总体故事" },
      { id: "sec-story", label: "数字故事" },
      { id: "sec-hidden", label: "隐藏性格" },
      { id: "sec-ability", label: "能力分布" },
      { id: "sec-health", label: "健康关系" },
      { id: "sec-career", label: "事业选择" },
      { id: "sec-directions", label: "最好方向" },
    ],
  },
  {
    href: "/heshu",
    label: "合数",
    minLevel: 1,
    sections: [
      { id: "sec-heshu", label: "合数" },
      { id: "sec-heshu-charts", label: "个人蓝图" },
    ],
  },
  {
    href: "/zeri",
    label: "择日",
    minLevel: 1,
    sections: [
      { id: "sec-zeri", label: "择日" },
      { id: "sec-zeri-combo", label: "择日组合" },
    ],
  },
  {
    href: "/planets",
    label: "电话号码",
    minLevel: 2,
    sections: [
      { id: "sec-input", label: "核心资料" },
      { id: "sec-planets-life", label: "人生蓝图" },
      { id: "sec-planets-ic", label: "身份证号码" },
      { id: "sec-planets-total", label: "人生蓝图 + 身份证八大行星总数" },
      { id: "sec-planets-phone", label: "电话号码八大行星" },
    ],
  }
];

export function SectionNav() {
  const [open, setOpen] = useState(false);
  // The locked tab whose upsell popup is showing, with its on-screen position.
  const [lockPopup, setLockPopup] = useState<{ href: string; top: number; left: number } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const { level, loading } = useAccessLevel();
  const startSubscribe = useStartSubscribe();
  // tier 1+ → "upgrade"; tier 0 → "subscribe".
  const isSubscriber = level >= 1;
  // 蓝图存档 needs a paid plan (tier ≥ 1). "Still loading" → treat as unlocked so
  // paying users don't see a flash of a locked tab.
  const archiveLocked = !loading && level < 1;
  // 电话号码存档 loads into the 电话号码 page, so it needs that page's tier (≥ 2).
  const phoneArchiveLocked = !loading && level < 2;
  // 记忆训练 needs the 至尊 plan (tier ≥ 3).
  const memoryLocked = !loading && level < 3;

  // 记忆训练 is a category that expands to its games.
  const [memoryOpen, setMemoryOpen] = useState(false);
  const router = useRouter();
  const { user, openModal } = useAuth();
  const {
    setNamePersonalDiagram,
    setbirthDatePersonalDiagram,
    setNamePhoneNumber,
    setbirthDatePhoneNumber,
    setIc,
  } = useInput();
  const { records, folders, loading: recordsLoading, refresh, refreshFolders } = useBlueprints();
  const {
    records: phoneRecords,
    folders: phoneFolders,
    loading: phoneRecordsLoading,
    refresh: refreshPhone,
    refreshFolders: refreshPhoneFolders,
  } = usePhoneArchives();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [phoneArchiveOpen, setPhoneArchiveOpen] = useState(false);
  const [collapsedPhoneGroups, setCollapsedPhoneGroups] = useState<Set<string>>(new Set());

  const uncategorizedRecords = useMemo(
    () => records.filter((r) => r.folder_id === null),
    [records],
  );
  const folderGroups = useMemo(
    () =>
      folders.map((folder) => ({
        folder,
        records: records.filter((r) => r.folder_id === folder.id),
      })),
    [folders, records],
  );
  const hasRecords = records.length > 0;

  const uncategorizedPhoneRecords = useMemo(
    () => phoneRecords.filter((r) => r.folder_id === null),
    [phoneRecords],
  );
  const phoneFolderGroups = useMemo(
    () =>
      phoneFolders.map((folder) => ({
        folder,
        records: phoneRecords.filter((r) => r.folder_id === folder.id),
      })),
    [phoneFolders, phoneRecords],
  );
  const hasPhoneRecords = phoneRecords.length > 0;

  const toggleArchive = () => {
    setLockPopup(null);
    const next = !archiveOpen;
    setArchiveOpen(next);
    if (next && user) {
      refresh();
      refreshFolders();
    }
  };

  const togglePhoneArchive = () => {
    setLockPopup(null);
    const next = !phoneArchiveOpen;
    setPhoneArchiveOpen(next);
    if (next && user) {
      refreshPhone();
      refreshPhoneFolders();
    }
  };

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePhoneGroup = (key: string) => {
    setCollapsedPhoneGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const loadRecord = (rec: Blueprint) => {
    setNamePersonalDiagram(rec.name);
    setbirthDatePersonalDiagram(rec.birth_date);
    setLockPopup(null);
    router.push("/");
  };

  // 电话号码存档 records populate the 电话号码 page's fields (including 身份证号码)
  // and land the user on that page.
  const loadPhoneRecord = (rec: PhoneArchive) => {
    setNamePhoneNumber(rec.name);
    setbirthDatePhoneNumber(rec.birth_date);
    setIc(rec.ic);
    setLockPopup(null);
    router.push("/planets");
  };

  const Chevron = ({ open }: { open: boolean }) => (
    <svg
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );

  // Drop the popup whenever we navigate; auto-expand 记忆训练 when on one of its games.
  useEffect(() => {
    setLockPopup(null);
    if (pathname === "/memory") setMemoryOpen(true);
    if (pathname === "/archive") setArchiveOpen(true);
    if (pathname === "/phone-archive") setPhoneArchiveOpen(true);
  }, [pathname]);

  // Collapse when clicking outside the nav — but not when dragging (e.g. text
  // selection), detected by how far the pointer moved between press and release.
  useEffect(() => {
    if (!open) return;
    let startX = 0;
    let startY = 0;
    const onDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (moved > 6) return; // treat as a drag, not a click
      if (navRef.current?.contains(e.target as Node)) return; // inside the nav
      setOpen(false);
      setLockPopup(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
    };
  }, [open]);

  // Toggle the upsell popup for a locked tab, anchored to the right of it.
  const onLockedClick = (href: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setLockPopup((cur) =>
      cur?.href === href ? null : { href, top: rect.top, left: rect.right + 8 },
    );
  };

  return (
    <nav ref={navRef} className="fixed left-0 top-24 z-40">
      {open ? (
        <div className="ml-2 max-h-[80vh] w-44 overflow-y-auto rounded-xl border border-amber-200/70 bg-white/85 p-3 shadow-lg ring-1 ring-amber-100/50 backdrop-blur">
          {/* Page links — the open page's 本页目录 sits directly beneath it. */}
          <div className="space-y-1">
            {PAGES.map((p) => {
              // Treat "still loading" as unlocked so paying users don't see a
              // flash of locked links on every page load.
              const locked = !loading && level < (p.minLevel ?? 0);
              const isActive = p.href === pathname;
              return (
                <div key={p.href}>
                  {locked ? (
                    <button
                      type="button"
                      onClick={(e) => onLockedClick(p.href, e)}
                      title="订阅后解锁"
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-amber-100/60 ${
                        lockPopup?.href === p.href ? "bg-amber-100/60 text-amber-800/70" : "text-amber-800/40"
                      }`}
                    >
                      <span>{p.label}</span>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      href={p.href}
                      onClick={() => setLockPopup(null)}
                      className={`block rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-amber-500 text-white shadow-sm"
                          : "text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                      }`}
                    >
                      {p.label}
                    </Link>
                  )}

                  {/* In-page directory, nested directly under the open page. */}
                  {isActive && !locked && p.sections.length > 0 && (
                    <div className="mb-1 mt-1.5 pl-2">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
                        本页目录
                      </p>
                      <ul className="space-y-1 border-l-2 border-amber-200 pl-3">
                        {p.sections.map((item, i) => (
                          <li key={item.id}>
                            <a
                              href={`#${item.id}`}
                              className="flex items-center gap-2 py-1 text-sm text-amber-700/70 transition hover:font-semibold hover:text-amber-900"
                            >
                              <span className="font-mono text-xs tabular-nums text-amber-400">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 蓝图存档 — saved records grouped by folder. */}
            <div>
              {archiveLocked ? (
                <button
                  type="button"
                  onClick={(e) => onLockedClick("/archive", e)}
                  title="订阅后解锁"
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-amber-100/60 ${
                    lockPopup?.href === "/archive" ? "bg-amber-100/60 text-amber-800/70" : "text-amber-800/40"
                  }`}
                >
                  <span>蓝图存档</span>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggleArchive}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      archiveOpen || pathname === "/archive"
                        ? "bg-amber-100/60 text-amber-900"
                        : "text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                    }`}
                  >
                    <span>蓝图存档</span>
                    <Chevron open={archiveOpen} />
                  </button>

                  {archiveOpen && (
                    <div className="mb-1 mt-1.5 pl-2">
                      {!user ? (
                        <button
                          type="button"
                          onClick={() => openModal()}
                          className="py-1 text-left text-sm text-amber-700/80 underline underline-offset-2 transition hover:text-amber-900"
                        >
                          请先登录以查看存档
                        </button>
                      ) : recordsLoading ? (
                        <p className="py-1 text-sm text-amber-700/60">加载中…</p>
                      ) : !hasRecords ? (
                        <p className="py-1 text-sm text-amber-700/60">暂无存档</p>
                      ) : (
                        <div className="space-y-1 border-l-2 border-amber-200 pl-3">
                          {folderGroups.map(
                            ({ folder, records: groupRecords }) =>
                              groupRecords.length > 0 && (
                                <div key={folder.id}>
                                  <button
                                    type="button"
                                    onClick={() => toggleGroup(folder.id)}
                                    className="flex w-full items-center justify-between gap-1 py-1 text-left text-xs font-semibold uppercase tracking-wider text-amber-700 transition hover:text-amber-900"
                                  >
                                    <span className="min-w-0 truncate">{folder.name}</span>
                                    <Chevron open={!collapsedGroups.has(folder.id)} />
                                  </button>
                                  {!collapsedGroups.has(folder.id) && (
                                    <ul className="space-y-0.5 pb-1 pl-1">
                                      {groupRecords.map((rec) => (
                                        <li key={rec.id}>
                                          <button
                                            type="button"
                                            onClick={() => loadRecord(rec)}
                                            title={rec.birth_date}
                                            className="block w-full truncate py-1 text-left text-sm text-amber-700/80 transition hover:font-semibold hover:text-amber-900"
                                          >
                                            {rec.name}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ),
                          )}
                          {uncategorizedRecords.length > 0 && (
                            <div>
                              <button
                                type="button"
                                onClick={() => toggleGroup("uncategorized")}
                                className="flex w-full items-center justify-between gap-1 py-1 text-left text-xs font-semibold uppercase tracking-wider text-amber-700 transition hover:text-amber-900"
                              >
                                <span>未分类</span>
                                <Chevron open={!collapsedGroups.has("uncategorized")} />
                              </button>
                              {!collapsedGroups.has("uncategorized") && (
                                <ul className="space-y-0.5 pb-1 pl-1">
                                  {uncategorizedRecords.map((rec) => (
                                    <li key={rec.id}>
                                      <button
                                        type="button"
                                        onClick={() => loadRecord(rec)}
                                        title={rec.birth_date}
                                        className="block w-full truncate py-1 text-left text-sm text-amber-700/80 transition hover:font-semibold hover:text-amber-900"
                                      >
                                        {rec.name}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <Link
                        href="/archive"
                        onClick={() => setLockPopup(null)}
                        className={`mt-2 block w-full rounded-lg px-3 py-2 text-center text-sm font-semibold transition ${
                          pathname === "/archive"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "border border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                        }`}
                      >
                        管理蓝图存档
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 电话号码存档 — saved name + 出生日期 + 身份证号码, grouped by folder.
                Clicking a record loads it into the 电话号码 page. */}
            <div>
              {phoneArchiveLocked ? (
                <button
                  type="button"
                  onClick={(e) => onLockedClick("/phone-archive", e)}
                  title="订阅后解锁"
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-amber-100/60 ${
                    lockPopup?.href === "/phone-archive" ? "bg-amber-100/60 text-amber-800/70" : "text-amber-800/40"
                  }`}
                >
                  <span>电话号码存档</span>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={togglePhoneArchive}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      phoneArchiveOpen || pathname === "/phone-archive"
                        ? "bg-amber-100/60 text-amber-900"
                        : "text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                    }`}
                  >
                    <span>电话号码存档</span>
                    <Chevron open={phoneArchiveOpen} />
                  </button>

                  {phoneArchiveOpen && (
                    <div className="mb-1 mt-1.5 pl-2">
                      {!user ? (
                        <button
                          type="button"
                          onClick={() => openModal()}
                          className="py-1 text-left text-sm text-amber-700/80 underline underline-offset-2 transition hover:text-amber-900"
                        >
                          请先登录以查看存档
                        </button>
                      ) : phoneRecordsLoading ? (
                        <p className="py-1 text-sm text-amber-700/60">加载中…</p>
                      ) : !hasPhoneRecords ? (
                        <p className="py-1 text-sm text-amber-700/60">暂无存档</p>
                      ) : (
                        <div className="space-y-1 border-l-2 border-amber-200 pl-3">
                          {phoneFolderGroups.map(
                            ({ folder, records: groupRecords }) =>
                              groupRecords.length > 0 && (
                                <div key={folder.id}>
                                  <button
                                    type="button"
                                    onClick={() => togglePhoneGroup(folder.id)}
                                    className="flex w-full items-center justify-between gap-1 py-1 text-left text-xs font-semibold uppercase tracking-wider text-amber-700 transition hover:text-amber-900"
                                  >
                                    <span className="min-w-0 truncate">{folder.name}</span>
                                    <Chevron open={!collapsedPhoneGroups.has(folder.id)} />
                                  </button>
                                  {!collapsedPhoneGroups.has(folder.id) && (
                                    <ul className="space-y-0.5 pb-1 pl-1">
                                      {groupRecords.map((rec) => (
                                        <li key={rec.id}>
                                          <button
                                            type="button"
                                            onClick={() => loadPhoneRecord(rec)}
                                            title={`${rec.birth_date}${rec.ic ? ` · ${rec.ic}` : ""}`}
                                            className="block w-full truncate py-1 text-left text-sm text-amber-700/80 transition hover:font-semibold hover:text-amber-900"
                                          >
                                            {rec.name}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ),
                          )}
                          {uncategorizedPhoneRecords.length > 0 && (
                            <div>
                              <button
                                type="button"
                                onClick={() => togglePhoneGroup("uncategorized")}
                                className="flex w-full items-center justify-between gap-1 py-1 text-left text-xs font-semibold uppercase tracking-wider text-amber-700 transition hover:text-amber-900"
                              >
                                <span>未分类</span>
                                <Chevron open={!collapsedPhoneGroups.has("uncategorized")} />
                              </button>
                              {!collapsedPhoneGroups.has("uncategorized") && (
                                <ul className="space-y-0.5 pb-1 pl-1">
                                  {uncategorizedPhoneRecords.map((rec) => (
                                    <li key={rec.id}>
                                      <button
                                        type="button"
                                        onClick={() => loadPhoneRecord(rec)}
                                        title={`${rec.birth_date}${rec.ic ? ` · ${rec.ic}` : ""}`}
                                        className="block w-full truncate py-1 text-left text-sm text-amber-700/80 transition hover:font-semibold hover:text-amber-900"
                                      >
                                        {rec.name}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <Link
                        href="/phone-archive"
                        onClick={() => setLockPopup(null)}
                        className={`mt-2 block w-full rounded-lg px-3 py-2 text-center text-sm font-semibold transition ${
                          pathname === "/phone-archive"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "border border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                        }`}
                      >
                        管理电话号码存档
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 记忆训练 — a category (至尊 tier) that expands to its games. */}
            <div>
              {memoryLocked ? (
                <button
                  type="button"
                  onClick={(e) => onLockedClick("memory", e)}
                  title="订阅后解锁"
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-amber-100/60 ${
                    lockPopup?.href === "memory" ? "bg-amber-100/60 text-amber-800/70" : "text-amber-800/40"
                  }`}
                >
                  <span>记忆训练</span>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setLockPopup(null);
                      setMemoryOpen((v) => !v);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      memoryOpen
                        ? "bg-amber-100/60 text-amber-900"
                        : "text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                    }`}
                  >
                    <span>记忆训练</span>
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${memoryOpen ? "rotate-90" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>

                  {memoryOpen && (
                    <div className="mb-1 mt-1.5 pl-2">
                      <ul className="space-y-1 border-l-2 border-amber-200 pl-3">
                        <li>
                          <Link
                            href="/memory"
                            onClick={() => setLockPopup(null)}
                            className={`block rounded-md py-1 text-sm transition ${
                              pathname === "/memory"
                                ? "font-semibold text-amber-900"
                                : "text-amber-700/80 hover:font-semibold hover:text-amber-900"
                            }`}
                          >
                            八大星属记忆训练
                          </Link>
                        </li>
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="展开目录"
          title="展开目录"
          className="flex h-12 w-9 items-center justify-center rounded-r-xl border border-l-0 border-amber-200/70 bg-white/85 text-amber-700 shadow-md ring-1 ring-amber-100/50 backdrop-blur transition hover:bg-amber-100 hover:text-amber-900"
        >
          ☰
        </button>
      )}

      {/* Upsell popup for a locked tab — fixed, anchored to the right of the tab. */}
      {open && lockPopup && (
        <div
          className="fixed z-50 w-56 rounded-xl border border-amber-200/70 bg-white p-3 shadow-lg ring-1 ring-amber-100/50"
          style={{ top: lockPopup.top, left: lockPopup.left }}
        >
          <p className="mb-3 text-sm font-medium text-amber-900">
            {isSubscriber ? "升级订阅以使用此页面" : "订阅以使用此页面"}
          </p>
          <button
            type="button"
            onClick={() => {
              setLockPopup(null);
              startSubscribe();
            }}
            className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            {isSubscriber ? "升级订阅" : "订阅"}
          </button>
        </div>
      )}
    </nav>
  );
}
