"use client";

// 操作者を選ぶセレクト。ここで選んだ人が、以降の操作の履歴に残る。

import { useOperator } from "./OperatorContext";

export function OperatorSelect() {
  const { users, operatorId, setOperatorId } = useOperator();

  return (
    <label className="flex items-center gap-2 text-sm">
      操作者
      <select
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        value={String(operatorId)}
        onChange={(e) => setOperatorId(Number(e.target.value))}
      >
        {users.map((user) => (
          <option key={user.id} value={String(user.id)}>
            {user.name}
          </option>
        ))}
      </select>
    </label>
  );
}
