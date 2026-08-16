// お問い合わせの内容を表示する。表示だけなのでServer Component。

import { StatusBadge } from "@/app/_components/StatusBadge";
import type { InquiryDetail } from "@/lib/types";

type Props = {
  inquiry: InquiryDetail;
};

export function InquiryDetailCard({ inquiry }: Props) {
  return (
    <div className="rounded border p-6">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold">{inquiry.subject}</h1>
        <StatusBadge status={inquiry.status} />
      </div>

      <dl className="mb-4 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="text-gray-500">お問い合わせ者</dt>
        <dd>{inquiry.name}</dd>

        <dt className="text-gray-500">メールアドレス</dt>
        <dd>{inquiry.email}</dd>

        <dt className="text-gray-500">担当者</dt>
        <dd>{inquiry.assignee?.name ?? "未割り当て"}</dd>

        <dt className="text-gray-500">受付日時</dt>
        <dd>{new Date(inquiry.created_at).toLocaleString("ja-JP")}</dd>

        <dt className="text-gray-500">最終更新</dt>
        <dd>{new Date(inquiry.updated_at).toLocaleString("ja-JP")}</dd>
      </dl>

      <div className="whitespace-pre-wrap rounded bg-gray-50 p-4 text-sm">
        {inquiry.body}
      </div>
    </div>
  );
}
