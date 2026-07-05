'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAccessLevel } from "./AccessProvider";
import { useAuth } from "./AuthProvider";

export type BlueprintFolder = {
  id: string;
  name: string;
  created_at: string;
};

// A saved 蓝图存档 record — a name + birth date tagged to the logged-in account.
export type Blueprint = {
  id: string;
  name: string;
  birth_date: string; // ISO "YYYY-MM-DD"
  created_at: string;
  folder_id: string | null;
};

type BlueprintsContextValue = {
  records: Blueprint[];
  folders: BlueprintFolder[];
  loading: boolean;
  foldersLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshFolders: () => Promise<void>;
  loadByFolder: (folderId: string | null) => Blueprint[];
  save: (name: string, birthDate: string, folderId?: string | null) => Promise<{ error: string | null }>;
  update: (id: string, birthDate: string, folderId?: string | null) => Promise<{ error: string | null }>;
  remove: (id: string) => Promise<void>;
  createFolder: (name: string) => Promise<{ error: string | null; folder?: BlueprintFolder }>;
  renameFolder: (id: string, name: string) => Promise<{ error: string | null }>;
  deleteFolder: (id: string) => Promise<{ error: string | null }>;
  moveToFolder: (id: string, folderId: string | null) => Promise<{ error: string | null }>;
};

const BlueprintsContext = createContext<BlueprintsContextValue | null>(null);
const BLUEPRINT_COLUMNS = "id, name, birth_date, created_at, folder_id";
const FOLDER_COLUMNS = "id, name, created_at";
const MAX_RECORDS = 10;

export function BlueprintsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isAdmin } = useAccessLevel();
  const [records, setRecords] = useState<Blueprint[]>([]);
  const [folders, setFolders] = useState<BlueprintFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFolders = useCallback(async () => {
    if (!supabase || !user) {
      setFolders([]);
      return;
    }
    setFoldersLoading(true);
    const { data, error } = await supabase
      .from("blueprint_folders")
      .select(FOLDER_COLUMNS)
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setFolders((data ?? []) as BlueprintFolder[]);
    setFoldersLoading(false);
  }, [user]);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setError(null);

    let query = supabase
      .from("blueprints")
      .select(BLUEPRINT_COLUMNS)
      .order("created_at", { ascending: false });
    if (!isAdmin) {
      query = query.limit(MAX_RECORDS);
    }

    const { data, error } = await query;
    if (error) setError(error.message);
    else setRecords((data ?? []) as Blueprint[]);
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
    async (name: string, birthDate: string, folderId?: string | null) => {
      if (!supabase) return { error: "服务尚未配置。" };
      if (!user) return { error: "请先登录。" };
      if (!isAdmin && records.length >= MAX_RECORDS) {
        return { error: `存档已满（最多 ${MAX_RECORDS} 条），请先删除。` };
      }
      const payload: { user_id: string; name: string; birth_date: string; folder_id?: string | null } = {
        user_id: user.id,
        name,
        birth_date: birthDate,
      };
      if (folderId !== undefined) payload.folder_id = folderId;
      const { data, error } = await supabase
        .from("blueprints")
        .insert(payload)
        .select(BLUEPRINT_COLUMNS)
        .single();
      if (error) return { error: error.message };
      if (data) setRecords((prev) => [data as Blueprint, ...prev]);
      return { error: null };
    },
    [user, records.length, isAdmin],
  );

  const update = useCallback(async (id: string, birthDate: string, folderId?: string | null) => {
    if (!supabase) return { error: "服务尚未配置。" };
    const payload: { birth_date: string; folder_id?: string | null } = { birth_date: birthDate };
    if (folderId !== undefined) payload.folder_id = folderId;
    const { data, error } = await supabase
      .from("blueprints")
      .update(payload)
      .eq("id", id)
      .select(BLUEPRINT_COLUMNS)
      .single();
    if (error) return { error: error.message };
    if (data) setRecords((prev) => prev.map((r) => (r.id === id ? (data as Blueprint) : r)));
    return { error: null };
  }, []);

  const remove = useCallback(async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("blueprints").delete().eq("id", id);
    if (!error) setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const createFolder = useCallback(
    async (name: string) => {
      if (!supabase) return { error: "服务尚未配置。" };
      if (!user) return { error: "请先登录。" };
      const trimmed = name.trim();
      if (!trimmed) return { error: "请输入文件夹名称。" };
      const { data, error } = await supabase
        .from("blueprint_folders")
        .insert({ user_id: user.id, name: trimmed })
        .select(FOLDER_COLUMNS)
        .single();
      if (error) return { error: error.message };
      const folder = data as BlueprintFolder;
      setFolders((prev) => [...prev, folder]);
      return { error: null, folder };
    },
    [user],
  );

  const renameFolder = useCallback(async (id: string, name: string) => {
    if (!supabase) return { error: "服务尚未配置。" };
    const trimmed = name.trim();
    if (!trimmed) return { error: "请输入文件夹名称。" };
    const { data, error } = await supabase
      .from("blueprint_folders")
      .update({ name: trimmed })
      .eq("id", id)
      .select(FOLDER_COLUMNS)
      .single();
    if (error) return { error: error.message };
    if (data) setFolders((prev) => prev.map((f) => (f.id === id ? (data as BlueprintFolder) : f)));
    return { error: null };
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    if (!supabase) return { error: "服务尚未配置。" };
    const { error } = await supabase.from("blueprint_folders").delete().eq("id", id);
    if (error) return { error: error.message };
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setRecords((prev) => prev.map((r) => (r.folder_id === id ? { ...r, folder_id: null } : r)));
    return { error: null };
  }, []);

  const moveToFolder = useCallback(async (id: string, folderId: string | null) => {
    if (!supabase) return { error: "服务尚未配置。" };
    const { data, error } = await supabase
      .from("blueprints")
      .update({ folder_id: folderId })
      .eq("id", id)
      .select(BLUEPRINT_COLUMNS)
      .single();
    if (error) return { error: error.message };
    if (data) setRecords((prev) => prev.map((r) => (r.id === id ? (data as Blueprint) : r)));
    return { error: null };
  }, []);

  return (
    <BlueprintsContext.Provider
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
    </BlueprintsContext.Provider>
  );
}

export function useBlueprints() {
  const ctx = useContext(BlueprintsContext);
  if (!ctx) throw new Error("useBlueprints must be used within a BlueprintsProvider");
  return ctx;
}
