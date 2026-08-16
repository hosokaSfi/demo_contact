// ステータスを色付きのバッジで表示する。一覧と詳細の両方で使う。

import { STATUS_LABELS, type InquiryStatus } from "@/lib/types";

const STATUS_CLASSES: Record<InquiryStatus, string> = {
  open: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-800",
  closed: "bg-green-100 text-green-700",
};

type Props = {
  status: InquiryStatus;
};

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
