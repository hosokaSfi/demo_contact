"use client";

// 一覧の絞り込み。選んだらURLのクエリを書き換えるだけで、状態は持たない。

import { useRouter } from "next/navigation";

import { Card } from "@/app/_components/Card";
import { STATUS_LABELS, type InquiryStatus, type User } from "@/lib/types";

type Props = {
  users: User[];
  currentStatus: string;
  currentAssigneeId: string;
};

const STATUSES: InquiryStatus[] = ["open", "in_progress", "pending", "closed"];

const selectClasses =
  "rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export function InquiryFilter({ users, currentStatus, currentAssigneeId }: Props) {
  const router = useRouter();

  const move = (status: string, assigneeId: string) => {
    const params = new URLSearchParams();

    if (status !== "") {
      params.set("status", status);
    }

    if (assigneeId !== "") {
      params.set("assignee_id", assigneeId);
    }

    const query = params.toString();
    router.push(query === "" ? "/inquiries" : `/inquiries?${query}`);
  };

  return (
    <Card padding="p-4" className="flex flex-wrap gap-4">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        対応状況
        <select
          className={selectClasses}
          value={currentStatus}
          onChange={(e) => move(e.target.value, currentAssigneeId)}
        >
          <option value="">すべて</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        担当者
        <select
          className={selectClasses}
          value={currentAssigneeId}
          onChange={(e) => move(currentStatus, e.target.value)}
        >
          <option value="">すべて</option>
          {users.map((user) => (
            <option key={user.id} value={String(user.id)}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
}
