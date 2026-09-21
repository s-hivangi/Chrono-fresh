import React, { createContext, useContext, useMemo, useState } from 'react';
import type { AnalyzeResult } from '../types/api';

type ScanSession = {
  imageUri: string | null;
  produceType: string;
  storageType: string;
  result: AnalyzeResult | null;
  setImageUri: (value: string | null) => void;
  setProduceType: (value: string) => void;
  setStorageType: (value: string) => void;
  setResult: (value: AnalyzeResult | null) => void;
  reset: () => void;
};

const Context = createContext<ScanSession | null>(null);

export function ScanSessionProvider({ children }: { children: React.ReactNode }) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [produceType, setProduceType] = useState('banana');
  const [storageType, setStorageType] = useState('room');
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const value = useMemo(() => ({
    imageUri, produceType, storageType, result,
    setImageUri, setProduceType, setStorageType, setResult,
    reset: () => { setImageUri(null); setResult(null); setProduceType('banana'); setStorageType('room'); },
  }), [imageUri, produceType, storageType, result]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useScanSession() {
  const value = useContext(Context);
  if (!value) throw new Error('useScanSession must be used inside ScanSessionProvider');
  return value;
}
