'use client';

import { useState, type FormEvent } from "react";

type FolderFormProps = {
  /** Empty for create mode; set for rename mode. */
  initialName?: string;
  submitLabel: string;
  onSubmit: (name: string) => Promise<{ error: string | null }>;
  onCancel?: () => void;
};

export function FolderForm({ initialName = "", submitLabel, onSubmit, onCancel }: FolderFormProps) {
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await onSubmit(name);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    if (!initialName) setName("");
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="文件夹名称"
        autoFocus
        className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-900 placeholder:text-amber-400/70 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="flex-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "保存中…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
}
