// ステータスを色付きのバッジで表示する。一覧と詳細の両方で使う。

import { STATUS_LABELS, type InquiryStatus } from "@/lib/types";

const STATUS_CLASSES: Record<InquiryStatus, string> = {
  open: "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20",
  in_progress: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  pending: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20",
  closed: "bg-green-50 text-green-700 ring-1 ring-green-600/20",
};

type Props = {
  status: InquiryStatus;
};

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
