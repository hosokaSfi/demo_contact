// お問い合わせの一覧を表で表示する。表示だけなのでServer Component。

import Link from "next/link";

import { StatusBadge } from "@/app/_components/StatusBadge";
import type { InquiryListItem } from "@/lib/types";

type Props = {
  inquiries: InquiryListItem[];
};

export function InquiryTable({ inquiries }: Props) {
  if (inquiries.length === 0) {
    return <p className="py-8 text-gray-500">お問い合わせがありません。</p>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b bg-gray-50 text-left">
          <th className="p-3">件名</th>
          <th className="p-3">お問い合わせ者</th>
          <th className="p-3">対応状況</th>
          <th className="p-3">担当者</th>
          <th className="p-3">受付日時</th>
        </tr>
      </thead>
      <tbody>
        {inquiries.map((inquiry) => (
          <tr key={inquiry.id} className="border-b hover:bg-gray-50">
            <td className="p-3">
              <Link
                href={`/inquiries/${inquiry.id}`}
                className="text-blue-600 hover:underline"
              >
                {inquiry.subject}
              </Link>
            </td>
            <td className="p-3">{inquiry.name}</td>
            <td className="p-3">
              <StatusBadge status={inquiry.status} />
            </td>
            <td className="p-3">{inquiry.assignee?.name ?? "未割り当て"}</td>
            <td className="p-3 text-gray-500">
              {new Date(inquiry.created_at).toLocaleString("ja-JP")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
