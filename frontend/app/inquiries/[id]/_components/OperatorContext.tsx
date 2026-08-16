"use client";

// 「今操作している担当者」を操作パネルの中で共有する。
// 認証がないため、誰が操作したかは画面で選んでもらう。

import { createContext, useContext, useState, type ReactNode } from "react";

import type { User } from "@/lib/types";

type OperatorContextValue = {
  users: User[];
  operatorId: number;
  setOperatorId: (id: number) => void;
};

const OperatorContext = createContext<OperatorContextValue | null>(null);

type Props = {
  users: User[];
  children: ReactNode;
};

export function OperatorProvider({ users, children }: Props) {
  const [operatorId, setOperatorId] = useState<number>(users[0]?.id ?? 0);

  return (
    <OperatorContext.Provider value={{ users, operatorId, setOperatorId }}>
      {children}
    </OperatorContext.Provider>
  );
}

export function useOperator(): OperatorContextValue {
  const value = useContext(OperatorContext);

  if (value === null) {
    throw new Error("OperatorProviderの中で使う");
  }

  return value;
}
