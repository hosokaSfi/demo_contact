// お問い合わせ詳細のページ。内容と対応履歴を表示する。

import { notFound } from "next/navigation";
import Link from "next/link";

import { AssigneeSelect } from "./_components/AssigneeSelect";
import { CommentForm } from "./_components/CommentForm";
import { HistoryTimeline } from "./_components/HistoryTimeline";
import { InquiryDetailCard } from "./_components/InquiryDetailCard";
import { OperatorProvider } from "./_components/OperatorContext";
import { OperatorSelect } from "./_components/OperatorSelect";
import { StatusSelect } from "./_components/StatusSelect";
import { apiGet } from "@/lib/api";
import type { InquiryDetail, User } from "@/lib/types";

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

  const users = await apiGet<User[]>("/api/users");

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/inquiries" className="text-sm text-blue-600 hover:underline">
        ← 一覧に戻る
      </Link>

      <div className="mt-4">
        <InquiryDetailCard inquiry={inquiry} />
      </div>

      <OperatorProvider users={users}>
        <section className="mt-6 rounded border p-6">
          <h2 className="mb-4 text-lg font-bold">対応</h2>

          <div className="mb-4 flex flex-wrap gap-4">
            <OperatorSelect />
            <StatusSelect inquiryId={inquiry.id} currentStatus={inquiry.status} />
            <AssigneeSelect
              inquiryId={inquiry.id}
              currentAssigneeId={inquiry.assignee?.id ?? null}
            />
          </div>

          <CommentForm inquiryId={inquiry.id} />
        </section>
      </OperatorProvider>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">対応履歴</h2>
        <HistoryTimeline histories={inquiry.histories} />
      </section>
    </main>
  );
}
