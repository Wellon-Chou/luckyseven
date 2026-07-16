'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { computeChart, type Chart } from "../lib/numerology";

type InputContextValue = {
  namePersonalDiagram: string;
  setNamePersonalDiagram: (value: string) => void;
  namePhoneNumber: string;
  setNamePhoneNumber: (value: string) => void;
  birthDatePersonalDiagram: string;
  setbirthDatePersonalDiagram: (value: string) => void;
  birthDatePhoneNumber: string;
  setbirthDatePhoneNumber: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  ic: string;
  setIc: (value: string) => void;
  personalChart: Chart;
  phoneNumberChart: Chart;
};

const InputContext = createContext<InputContextValue | null>(null);
const STORAGE_KEY = "life-chart-input";

export function InputProvider({ children }: { children: ReactNode }) {
  const [namePersonalDiagram, setNamePersonalDiagram] = useState("");
  const [namePhoneNumber, setNamePhoneNumber] = useState("");
  const [birthDatePersonalDiagram, setbirthDatePersonalDiagram] = useState("");
  const [birthDatePhoneNumber, setbirthDatePhoneNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [ic, setIc] = useState("");

  // Restore once on mount (client-only; avoids hydration mismatch).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        namePersonalDiagram: string;
        namePhoneNumber: string;
        birthDatePersonalDiagram: string;
        birthDatePhoneNumber: string;
        phone: string;
        ic: string;
      }>;
      if (saved.namePersonalDiagram) setNamePersonalDiagram(saved.namePersonalDiagram);
      if (saved.namePhoneNumber) setNamePhoneNumber(saved.namePhoneNumber);
      if (saved.birthDatePersonalDiagram) setbirthDatePersonalDiagram(saved.birthDatePersonalDiagram);
      if (saved.birthDatePhoneNumber) setbirthDatePhoneNumber(saved.birthDatePhoneNumber);
      if (saved.phone) setPhone(saved.phone);
      if (saved.ic) setIc(saved.ic);
    } catch {
      /* ignore unavailable / malformed storage */
    }
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ namePersonalDiagram, namePhoneNumber, birthDatePersonalDiagram, birthDatePhoneNumber, phone, ic }));
    } catch {
      /* ignore */
    }
  }, [namePersonalDiagram, namePhoneNumber, birthDatePersonalDiagram, birthDatePhoneNumber, phone, ic]);

  const personalChart = computeChart(birthDatePersonalDiagram);
  const phoneNumberChart = computeChart(birthDatePhoneNumber);

  return (
    <InputContext.Provider
      value={{ namePersonalDiagram, setNamePersonalDiagram, namePhoneNumber, setNamePhoneNumber, 
               birthDatePersonalDiagram, setbirthDatePersonalDiagram, birthDatePhoneNumber, setbirthDatePhoneNumber, 
               phone, setPhone, ic, setIc, personalChart, phoneNumberChart }}
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
