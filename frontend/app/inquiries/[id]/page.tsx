// お問い合わせ詳細のページ。内容と対応履歴を表示する。

import { notFound } from "next/navigation";

import { AssigneeSelect } from "./_components/AssigneeSelect";
import { CommentForm } from "./_components/CommentForm";
import { HistoryTimeline } from "./_components/HistoryTimeline";
import { InquiryDetailCard } from "./_components/InquiryDetailCard";
import { OperatorProvider } from "./_components/OperatorContext";
import { OperatorSelect } from "./_components/OperatorSelect";
import { StatusSelect } from "./_components/StatusSelect";
import { Card } from "@/app/_components/Card";
import { PageHeader } from "@/app/_components/PageHeader";
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
    <>
      <PageHeader backHref="/inquiries" backLabel="一覧に戻る" />

      <main className="mx-auto max-w-3xl p-8">
        <InquiryDetailCard inquiry={inquiry} />

        <OperatorProvider users={users}>
          <Card className="mt-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900">対応</h2>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <OperatorSelect />
              <StatusSelect inquiryId={inquiry.id} currentStatus={inquiry.status} />
              <AssigneeSelect
                inquiryId={inquiry.id}
                currentAssigneeId={inquiry.assignee?.id ?? null}
              />
            </div>

            <CommentForm inquiryId={inquiry.id} />
          </Card>
        </OperatorProvider>

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900">対応履歴</h2>
          <HistoryTimeline histories={inquiry.histories} />
        </section>
      </main>
    </>
  );
}
