'use client';

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthProvider";
import { useBlueprints, type Blueprint } from "../BlueprintsProvider";

type BlueprintRecordPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (record: Blueprint) => void;
};

export function BlueprintRecordPicker({ open, onClose, onSelect }: BlueprintRecordPickerProps) {
  const { user, openModal } = useAuth();
  const { records, folders, loading, loadByFolder } = useBlueprints();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const uncategorizedRecords = useMemo(() => loadByFolder(null), [loadByFolder]);
  const folderGroups = useMemo(
    () =>
      folders
        .map((folder) => ({
          folder,
          records: loadByFolder(folder.id),
        }))
        .filter((group) => group.records.length > 0),
    [folders, loadByFolder],
  );

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelect = (record: Blueprint) => {
    onSelect(record);
    onClose();
  };

  if (!open) return null;

  const Chevron = ({ expanded }: { expanded: boolean }) => (
    <svg
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blueprint-picker-title"
        className="flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-amber-200/70 bg-white shadow-lg ring-1 ring-amber-100/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-amber-200/70 px-4 py-3">
          <h2 id="blueprint-picker-title" className="text-base font-bold text-amber-900">
            选择蓝图存档
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-500 transition hover:bg-amber-100 hover:text-amber-900"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3">
          {!user ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-amber-700/80">请先登录以查看存档。</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openModal();
                }}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                登录
              </button>
            </div>
          ) : loading ? (
            <p className="py-6 text-center text-sm text-amber-700/60">加载中…</p>
          ) : records.length === 0 ? (
            <p className="py-6 text-center text-sm text-amber-700/60">暂无存档</p>
          ) : (
            <div className="space-y-2">
              {folderGroups.map(({ folder, records: groupRecords }) => {
                const expanded = !collapsedGroups.has(folder.id);
                return (
                  <div key={folder.id}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(folder.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-amber-700 transition hover:bg-amber-50 hover:text-amber-900"
                    >
                      <span className="min-w-0 truncate">{folder.name}</span>
                      <Chevron expanded={expanded} />
                    </button>
                    {expanded && (
                      <ul className="mt-0.5 space-y-0.5 border-l-2 border-amber-200 pl-3">
                        {groupRecords.map((rec) => (
                          <li key={rec.id}>
                            <button
                              type="button"
                              onClick={() => handleSelect(rec)}
                              className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-amber-800 transition hover:bg-amber-100 hover:font-semibold hover:text-amber-900"
                            >
                              <span className="block truncate">{rec.name}</span>
                              <span className="font-mono text-xs tabular-nums text-amber-600/70">
                                {rec.birth_date}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              {uncategorizedRecords.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleGroup("uncategorized")}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-amber-700 transition hover:bg-amber-50 hover:text-amber-900"
                  >
                    <span>未分类</span>
                    <Chevron expanded={!collapsedGroups.has("uncategorized")} />
                  </button>
                  {!collapsedGroups.has("uncategorized") && (
                    <ul className="mt-0.5 space-y-0.5 border-l-2 border-amber-200 pl-3">
                      {uncategorizedRecords.map((rec) => (
                        <li key={rec.id}>
                          <button
                            type="button"
                            onClick={() => handleSelect(rec)}
                            className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-amber-800 transition hover:bg-amber-100 hover:font-semibold hover:text-amber-900"
                          >
                            <span className="block truncate">{rec.name}</span>
                            <span className="font-mono text-xs tabular-nums text-amber-600/70">
                              {rec.birth_date}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
