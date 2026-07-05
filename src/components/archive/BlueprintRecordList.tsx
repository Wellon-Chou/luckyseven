'use client';

import { useMemo } from "react";
import { useBlueprints } from "../BlueprintsProvider";
import { BlueprintRecordCard } from "./BlueprintRecordCard";
import type { FolderSelection } from "./FolderList";

type BlueprintRecordListProps = {
  selectedFolder: FolderSelection;
};

export function BlueprintRecordList({ selectedFolder }: BlueprintRecordListProps) {
  const { records, folders, loading, loadByFolder } = useBlueprints();

  const filtered = useMemo(() => {
    if (selectedFolder === "all") return records;
    return loadByFolder(selectedFolder);
  }, [selectedFolder, records, loadByFolder]);

  const heading =
    selectedFolder === "all"
      ? "全部存档"
      : folders.find((f) => f.id === selectedFolder)?.name ?? "文件夹";

  if (loading) {
    return <p className="py-8 text-center text-sm text-amber-700/60">加载中…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-amber-900">{heading}</h2>
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 py-12 text-center text-sm text-amber-700/60">
          此文件夹暂无存档
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((rec) => (
            <li key={rec.id}>
              <BlueprintRecordCard record={rec} folders={folders} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
