'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePhoneArchives, type PhoneArchive, type PhoneArchiveFolder } from "../PhoneArchivesProvider";
import { useInput } from "../InputProvider";

type PhoneRecordCardProps = {
  record: PhoneArchive;
  folders: PhoneArchiveFolder[];
};

export function PhoneRecordCard({ record, folders }: PhoneRecordCardProps) {
  const router = useRouter();
  const { setNamePhoneNumber, setbirthDatePhoneNumber, setIc } = useInput();
  const { remove, moveToFolder } = usePhoneArchives();
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  // Load into the 电话号码 page's own fields (not 个人蓝图's) and go there.
  const loadRecord = () => {
    setNamePhoneNumber(record.name);
    setbirthDatePhoneNumber(record.birth_date);
    setIc(record.ic);
    router.push("/planets");
  };

  const handleMove = async (folderId: string | null) => {
    setMoving(true);
    setMoveError(null);
    const { error } = await moveToFolder(record.id, folderId);
    setMoving(false);
    if (error) setMoveError(error);
  };

  const folderName =
    record.folder_id === null
      ? "未分类"
      : folders.find((f) => f.id === record.folder_id)?.name ?? "未知文件夹";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200/70 bg-white p-4 shadow-sm ring-1 ring-amber-100/50 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={loadRecord}
          className="truncate text-left text-base font-semibold text-amber-900 transition hover:text-amber-700"
        >
          {record.name}
        </button>
        <p className="mt-0.5 font-mono text-sm tabular-nums text-amber-700/70">{record.birth_date}</p>
        <p className="mt-0.5 truncate font-mono text-sm text-amber-700/70">
          身份证：{record.ic || "–"}
        </p>
        <p className="mt-1 text-xs text-amber-600/70">{folderName}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <select
          value={record.folder_id ?? ""}
          disabled={moving}
          onChange={(e) => handleMove(e.target.value || null)}
          aria-label="移动到文件夹"
          className="min-w-0 max-w-full flex-1 rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm text-amber-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50 sm:flex-none sm:max-w-none"
        >
          <option value="">未分类</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => remove(record.id)}
          aria-label="删除"
          title="删除"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-400 transition hover:bg-amber-100 hover:text-red-500"
        >
          ×
        </button>
      </div>
      {moveError && <p className="w-full text-xs text-red-600 sm:text-right">{moveError}</p>}
    </div>
  );
}
