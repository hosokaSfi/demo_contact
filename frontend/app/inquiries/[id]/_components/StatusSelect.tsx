"use client";

// 対応状況を変更する。変更するとサーバー側で履歴が自動的に記録される。

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOperator } from "./OperatorContext";
import { apiPatch } from "@/lib/api";
import { STATUS_LABELS, type InquiryDetail, type InquiryStatus } from "@/lib/types";

const STATUSES: InquiryStatus[] = ["open", "in_progress", "pending", "closed"];

type Props = {
  inquiryId: number;
  currentStatus: InquiryStatus;
};

export function StatusSelect({ inquiryId, currentStatus }: Props) {
  const router = useRouter();
  const { operatorId } = useOperator();
  const [saving, setSaving] = useState(false);

  const change = async (status: string) => {
    setSaving(true);

    try {
      await apiPatch<InquiryDetail>(
        `/api/inquiries/${inquiryId}/status?user_id=${operatorId}`,
        { status },
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      対応状況
      <select
        className="rounded border px-2 py-1"
        value={currentStatus}
        disabled={saving}
        onChange={(e) => change(e.target.value)}
      >
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </label>
  );
}
