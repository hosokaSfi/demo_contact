// お問い合わせ詳細のページ。内容と対応履歴を表示する。

import { notFound } from "next/navigation";
import Link from "next/link";

import { HistoryTimeline } from "./_components/HistoryTimeline";
import { InquiryDetailCard } from "./_components/InquiryDetailCard";
import { apiGet } from "@/lib/api";
import type { InquiryDetail } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InquiryDetailPage({ params }: Props) {
  const { id } = await params;

  let inquiry: InquiryDetail;

  try {
    inquiry = await apiGet<InquiryDetail>(`/api/inquiries/${id}`);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/inquiries" className="text-sm text-blue-600 hover:underline">
        ← 一覧に戻る
      </Link>

      <div className="mt-4">
        <InquiryDetailCard inquiry={inquiry} />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">対応履歴</h2>
        <HistoryTimeline histories={inquiry.histories} />
      </section>
    </main>
  );
}
