"use client";

// 操作者を選ぶセレクト。ここで選んだ人が、以降の操作の履歴に残る。

import { useOperator } from "./OperatorContext";

export function OperatorSelect() {
  const { users, operatorId, setOperatorId } = useOperator();

  return (
    <label className="flex items-center gap-2 text-sm">
      操作者
      <select
        className="rounded border px-2 py-1"
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
