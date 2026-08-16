// お問い合わせの一覧を表で表示する。表示だけなのでServer Component。

import Link from "next/link";
import { Inbox } from "lucide-react";

import { Card } from "@/app/_components/Card";
import { StatusBadge } from "@/app/_components/StatusBadge";
import type { InquiryListItem } from "@/lib/types";

type Props = {
  inquiries: InquiryListItem[];
};

export function InquiryTable({ inquiries }: Props) {
  if (inquiries.length === 0) {
    return (
      <Card className="flex flex-col items-center py-12 text-center">
        <Inbox className="mb-3 h-8 w-8 text-gray-300" />
        <p className="text-gray-500">該当するお問い合わせがありません。</p>
      </Card>
    );
  }

  return (
    <Card padding="p-0" className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs tracking-wide text-gray-500 uppercase">
            <th className="p-3">件名</th>
            <th className="p-3">お問い合わせ者</th>
            <th className="p-3">対応状況</th>
            <th className="p-3">担当者</th>
            <th className="p-3">受付日時</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {inquiries.map((inquiry) => (
            <tr key={inquiry.id} className="hover:bg-indigo-50/50">
              <td className="p-3">
                <Link
                  href={`/inquiries/${inquiry.id}`}
                  className="text-indigo-600 hover:underline"
                >
                  {inquiry.subject}
                </Link>
              </td>
              <td className="p-3">{inquiry.name}</td>
              <td className="p-3">
                <StatusBadge status={inquiry.status} />
              </td>
              <td className="p-3">
                {inquiry.assignee?.name ?? (
                  <span className="text-gray-400">未割り当て</span>
                )}
              </td>
              <td className="p-3 text-gray-500">
                {new Date(inquiry.created_at).toLocaleString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
