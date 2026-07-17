'use client';

import { useState } from "react";
import { FolderForm } from "./FolderForm";

export type FolderSelection = "all" | string;

// Structural shape shared by BlueprintFolder and PhoneArchiveFolder, so this
// list renders either archive's folders.
export type ArchiveFolder = { id: string; name: string; created_at: string };

type FolderListProps = {
  selected: FolderSelection;
  onSelect: (id: FolderSelection) => void;
  // Folder data + operations come from whichever archive provider owns them
  // (蓝图存档 → useBlueprints, 电话号码存档 → usePhoneArchives).
  folders: ArchiveFolder[];
  foldersLoading: boolean;
  createFolder: (name: string) => Promise<{ error: string | null }>;
  renameFolder: (id: string, name: string) => Promise<{ error: string | null }>;
  deleteFolder: (id: string) => Promise<{ error: string | null }>;
};

export function FolderList({
  selected,
  onSelect,
  folders,
  foldersLoading,
  createFolder,
  renameFolder,
  deleteFolder,
}: FolderListProps) {
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (folder: ArchiveFolder) => {
    const { error } = await deleteFolder(folder.id);
    if (!error) {
      setDeleteConfirmId(null);
      if (selected === folder.id) onSelect("all");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700">文件夹</h3>

      <button
        type="button"
        onClick={() => onSelect("all")}
        className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
          selected === "all"
            ? "bg-amber-500 text-white shadow-sm"
            : "text-amber-800 hover:bg-amber-100 hover:text-amber-900"
        }`}
      >
        全部存档
      </button>

      {foldersLoading ? (
        <p className="px-3 py-1 text-sm text-amber-700/60">加载中…</p>
      ) : (
        <ul className="space-y-1">
          {folders.map((folder) => (
            <li key={folder.id}>
              {renamingId === folder.id ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2">
                  <FolderForm
                    initialName={folder.name}
                    submitLabel="重命名"
                    onSubmit={(name) => renameFolder(folder.id, name)}
                    onCancel={() => setRenamingId(null)}
                  />
                </div>
              ) : deleteConfirmId === folder.id ? (
                <div className="rounded-lg border border-red-200 bg-red-50/60 p-2">
                  <p className="mb-2 text-xs text-red-700">删除「{folder.name}」？存档将移至未分类。</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(folder)}
                      className="flex-1 rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-600"
                    >
                      确认删除
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="rounded-lg border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelect(folder.id)}
                    className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                      selected === folder.id
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                    }`}
                  >
                    {folder.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenamingId(folder.id)}
                    aria-label="重命名"
                    title="重命名"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-amber-400 opacity-0 transition hover:bg-amber-100 hover:text-amber-700 group-hover:opacity-100"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(folder.id)}
                    aria-label="删除"
                    title="删除"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-amber-400 opacity-0 transition hover:bg-amber-100 hover:text-red-500 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2">
          <FolderForm
            submitLabel="创建"
            onSubmit={createFolder}
            onCancel={() => setCreating(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-lg border border-dashed border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 transition hover:border-amber-400 hover:bg-amber-50"
        >
          + 新建文件夹
        </button>
      )}
    </div>
  );
}
