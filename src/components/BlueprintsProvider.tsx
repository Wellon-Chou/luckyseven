'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

// A saved 蓝图存档 record — a name + birth date tagged to the logged-in account.
export type Blueprint = {
  id: string;
  name: string;
  birth_date: string; // ISO "YYYY-MM-DD"
  created_at: string;
};

type BlueprintsContextValue = {
  records: Blueprint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (name: string, birthDate: string) => Promise<{ error: string | null }>;
  remove: (id: string) => Promise<void>;
};

const BlueprintsContext = createContext<BlueprintsContextValue | null>(null);
const COLUMNS = "id, name, birth_date, created_at";
const MAX_RECORDS = 10;

export function BlueprintsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("blueprints")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .limit(MAX_RECORDS);
    if (error) setError(error.message);
    else setRecords((data ?? []) as Blueprint[]);
    setLoading(false);
  }, [user]);

  // (Re)load whenever the signed-in user changes.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (name: string, birthDate: string) => {
      if (!supabase) return { error: "服务尚未配置。" };
      if (!user) return { error: "请先登录。" };
      if (records.length >= MAX_RECORDS) {
        return { error: `存档已满（最多 ${MAX_RECORDS} 条），请先删除。` };
      }
      const { data, error } = await supabase
        .from("blueprints")
        .insert({ user_id: user.id, name, birth_date: birthDate })
        .select(COLUMNS)
        .single();
      if (error) return { error: error.message };
      if (data) setRecords((prev) => [data as Blueprint, ...prev]);
      return { error: null };
    },
    [user, records.length],
  );

  const remove = useCallback(async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("blueprints").delete().eq("id", id);
    if (!error) setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <BlueprintsContext.Provider value={{ records, loading, error, refresh, save, remove }}>
      {children}
    </BlueprintsContext.Provider>
  );
}

export function useBlueprints() {
  const ctx = useContext(BlueprintsContext);
  if (!ctx) throw new Error("useBlueprints must be used within a BlueprintsProvider");
  return ctx;
}
