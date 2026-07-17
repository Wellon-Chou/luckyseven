'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { withRetry } from "../lib/retry";
import { useAccessLevel } from "./AccessProvider";
import { useAuth } from "./AuthProvider";

export type PhoneArchiveFolder = {
  id: string;
  name: string;
  created_at: string;
};

// A saved 电话号码存档 record — name + birth date + 身份证号码, tagged to the
// logged-in account. Mirrors Blueprint but carries the IC as well, and loads
// into the 电话号码 page rather than 个人蓝图.
export type PhoneArchive = {
  id: string;
  name: string;
  birth_date: string; // ISO "YYYY-MM-DD"
  ic: string;
  created_at: string;
  folder_id: string | null;
};

type PhoneArchivesContextValue = {
  records: PhoneArchive[];
  folders: PhoneArchiveFolder[];
  loading: boolean;
  foldersLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshFolders: () => Promise<void>;
  loadByFolder: (folderId: string | null) => PhoneArchive[];
  save: (
    name: string,
    birthDate: string,
    ic: string,
    folderId?: string | null,
  ) => Promise<{ error: string | null }>;
  update: (
    id: string,
    birthDate: string,
    ic: string,
    folderId?: string | null,
  ) => Promise<{ error: string | null }>;
  remove: (id: string) => Promise<void>;
  createFolder: (name: string) => Promise<{ error: string | null; folder?: PhoneArchiveFolder }>;
  renameFolder: (id: string, name: string) => Promise<{ error: string | null }>;
  deleteFolder: (id: string) => Promise<{ error: string | null }>;
  moveToFolder: (id: string, folderId: string | null) => Promise<{ error: string | null }>;
};

const PhoneArchivesContext = createContext<PhoneArchivesContextValue | null>(null);
const ARCHIVE_COLUMNS = "id, name, birth_date, ic, created_at, folder_id";
const FOLDER_COLUMNS = "id, name, created_at";
const MAX_RECORDS = 10;

export function PhoneArchivesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isAdmin } = useAccessLevel();
  const [records, setRecords] = useState<PhoneArchive[]>([]);
  const [folders, setFolders] = useState<PhoneArchiveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFolders = useCallback(async () => {
    if (!supabase || !user) {
      setFolders([]);
      return;
    }
    setFoldersLoading(true);
    const { data, error } = await withRetry(() =>
      supabase!
        .from("phone_archive_folders")
        .select(FOLDER_COLUMNS)
        .order("created_at", { ascending: true }),
    );
    if (error) setError(error.message);
    else setFolders((data ?? []) as PhoneArchiveFolder[]);
    setFoldersLoading(false);
  }, [user]);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error } = await withRetry(() => {
      let query = supabase!
        .from("phone_archives")
        .select(ARCHIVE_COLUMNS)
        .order("created_at", { ascending: false });
      if (!isAdmin) {
        query = query.limit(MAX_RECORDS);
      }
      return query;
    });
    if (error) setError(error.message);
    else setRecords((data ?? []) as PhoneArchive[]);
    setLoading(false);
  }, [user, isAdmin]);

  // (Re)load whenever the signed-in user changes.
  useEffect(() => {
    refresh();
    refreshFolders();
  }, [refresh, refreshFolders]);

  const loadByFolder = useCallback(
    (folderId: string | null) => {
      if (folderId === null) return records.filter((r) => r.folder_id === null);
      return records.filter((r) => r.folder_id === folderId);
    },
    [records],
  );

  const save = useCallback(
    async (name: string, birthDate: string, ic: string, folderId?: string | null) => {
      if (!supabase) return { error: "服务尚未配置。" };
      if (!user) return { error: "请先登录。" };
      if (!isAdmin && records.length >= MAX_RECORDS) {
        return { error: `存档已满（最多 ${MAX_RECORDS} 条），请先删除。` };
      }
      const payload: {
        user_id: string;
        name: string;
        birth_date: string;
        ic: string;
        folder_id?: string | null;
      } = {
        user_id: user.id,
        name,
        birth_date: birthDate,
        ic,
      };
      if (folderId !== undefined) payload.folder_id = folderId;
      const { data, error } = await withRetry(() =>
        supabase!.from("phone_archives").insert(payload).select(ARCHIVE_COLUMNS).single(),
      );
      if (error) return { error: error.message };
      if (data) setRecords((prev) => [data as PhoneArchive, ...prev]);
      return { error: null };
    },
    [user, records.length, isAdmin],
  );

  const update = useCallback(
    async (id: string, birthDate: string, ic: string, folderId?: string | null) => {
      if (!supabase) return { error: "服务尚未配置。" };
      const payload: { birth_date: string; ic: string; folder_id?: string | null } = {
        birth_date: birthDate,
        ic,
      };
      if (folderId !== undefined) payload.folder_id = folderId;
      const { data, error } = await withRetry(() =>
        supabase!
          .from("phone_archives")
          .update(payload)
          .eq("id", id)
          .select(ARCHIVE_COLUMNS)
          .single(),
      );
      if (error) return { error: error.message };
      if (data) setRecords((prev) => prev.map((r) => (r.id === id ? (data as PhoneArchive) : r)));
      return { error: null };
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    if (!supabase) return;
    const { error } = await withRetry(() =>
      supabase!.from("phone_archives").delete().eq("id", id),
    );
    if (!error) setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const createFolder = useCallback(
    async (name: string) => {
      if (!supabase) return { error: "服务尚未配置。" };
      if (!user) return { error: "请先登录。" };
      const trimmed = name.trim();
      if (!trimmed) return { error: "请输入文件夹名称。" };
      const { data, error } = await withRetry(() =>
        supabase!
          .from("phone_archive_folders")
          .insert({ user_id: user.id, name: trimmed })
          .select(FOLDER_COLUMNS)
          .single(),
      );
      if (error) return { error: error.message };
      const folder = data as PhoneArchiveFolder;
      setFolders((prev) => [...prev, folder]);
      return { error: null, folder };
    },
    [user],
  );

  const renameFolder = useCallback(async (id: string, name: string) => {
    if (!supabase) return { error: "服务尚未配置。" };
    const trimmed = name.trim();
    if (!trimmed) return { error: "请输入文件夹名称。" };
    const { data, error } = await withRetry(() =>
      supabase!
        .from("phone_archive_folders")
        .update({ name: trimmed })
        .eq("id", id)
        .select(FOLDER_COLUMNS)
        .single(),
    );
    if (error) return { error: error.message };
    if (data)
      setFolders((prev) => prev.map((f) => (f.id === id ? (data as PhoneArchiveFolder) : f)));
    return { error: null };
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    if (!supabase) return { error: "服务尚未配置。" };
    const { error } = await withRetry(() =>
      supabase!.from("phone_archive_folders").delete().eq("id", id),
    );
    if (error) return { error: error.message };
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setRecords((prev) => prev.map((r) => (r.folder_id === id ? { ...r, folder_id: null } : r)));
    return { error: null };
  }, []);

  const moveToFolder = useCallback(async (id: string, folderId: string | null) => {
    if (!supabase) return { error: "服务尚未配置。" };
    const { data, error } = await withRetry(() =>
      supabase!
        .from("phone_archives")
        .update({ folder_id: folderId })
        .eq("id", id)
        .select(ARCHIVE_COLUMNS)
        .single(),
    );
    if (error) return { error: error.message };
    if (data) setRecords((prev) => prev.map((r) => (r.id === id ? (data as PhoneArchive) : r)));
    return { error: null };
  }, []);

  return (
    <PhoneArchivesContext.Provider
      value={{
        records,
        folders,
        loading,
        foldersLoading,
        error,
        refresh,
        refreshFolders,
        loadByFolder,
        save,
        update,
        remove,
        createFolder,
        renameFolder,
        deleteFolder,
        moveToFolder,
      }}
    >
      {children}
    </PhoneArchivesContext.Provider>
  );
}

export function usePhoneArchives() {
  const ctx = useContext(PhoneArchivesContext);
  if (!ctx) throw new Error("usePhoneArchives must be used within a PhoneArchivesProvider");
  return ctx;
}
