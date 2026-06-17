'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { computeChart, type Chart } from "../lib/numerology";

// Shared input state so both pages (个人蓝图 and 八大行星) see the same birth
// date / phone / IC and the same computed chart. Lives above the pages (in the
// root layout) so it survives client-side navigation between them, and is
// persisted to sessionStorage so a refresh / direct link to the second page
// keeps the data for the session.

type InputContextValue = {
  name: string;
  setName: (value: string) => void;
  birthDate: string;
  setBirthDate: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  ic: string;
  setIc: (value: string) => void;
  chart: Chart;
};

const InputContext = createContext<InputContextValue | null>(null);
const STORAGE_KEY = "life-chart-input";

export function InputProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [ic, setIc] = useState("");

  // Restore once on mount (client-only; avoids hydration mismatch).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        name: string;
        birthDate: string;
        phone: string;
        ic: string;
      }>;
      if (saved.name) setName(saved.name);
      if (saved.birthDate) setBirthDate(saved.birthDate);
      if (saved.phone) setPhone(saved.phone);
      if (saved.ic) setIc(saved.ic);
    } catch {
      /* ignore unavailable / malformed storage */
    }
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ name, birthDate, phone, ic }));
    } catch {
      /* ignore */
    }
  }, [name, birthDate, phone, ic]);

  const chart = computeChart(birthDate);

  return (
    <InputContext.Provider
      value={{ name, setName, birthDate, setBirthDate, phone, setPhone, ic, setIc, chart }}
    >
      {children}
    </InputContext.Provider>
  );
}

export function useInput() {
  const ctx = useContext(InputContext);
  if (!ctx) throw new Error("useInput must be used within an InputProvider");
  return ctx;
}
