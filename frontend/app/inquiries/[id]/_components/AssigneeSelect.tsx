"use client";

// 担当者を割り当てる。空を選ぶと解除になる。

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOperator } from "./OperatorContext";
import { apiPatch } from "@/lib/api";
import type { InquiryDetail } from "@/lib/types";

type Props = {
  inquiryId: number;
  currentAssigneeId: number | null;
};

export function AssigneeSelect({ inquiryId, currentAssigneeId }: Props) {
  const router = useRouter();
  const { users, operatorId } = useOperator();
  const [saving, setSaving] = useState(false);

  const change = async (value: string) => {
    setSaving(true);

    try {
      await apiPatch<InquiryDetail>(
        `/api/inquiries/${inquiryId}/assignee?user_id=${operatorId}`,
        { assignee_id: value === "" ? null : Number(value) },
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      担当者
      <select
        className="rounded border px-2 py-1"
        value={currentAssigneeId === null ? "" : String(currentAssigneeId)}
        disabled={saving}
        onChange={(e) => change(e.target.value)}
      >
        <option value="">未割り当て</option>
        {users.map((user) => (
          <option key={user.id} value={String(user.id)}>
            {user.name}
          </option>
        ))}
      </select>
    </label>
  );
}
