// お問い合わせ一覧のページ。絞り込み条件はURLのクエリから読む。

import { InquiryFilter } from "./_components/InquiryFilter";
import { InquiryTable } from "./_components/InquiryTable";
import { apiGet } from "@/lib/api";
import type { InquiryListItem, User } from "@/lib/types";

type Props = {
  searchParams: Promise<{ status?: string; assignee_id?: string }>;
};

export default async function InquiriesPage({ searchParams }: Props) {
  const { status = "", assignee_id: assigneeId = "" } = await searchParams;

  const params = new URLSearchParams();

  if (status !== "") {
    params.set("status", status);
  }

  if (assigneeId !== "") {
    params.set("assignee_id", assigneeId);
  }

  const query = params.toString();
  const [inquiries, users] = await Promise.all([
    apiGet<InquiryListItem[]>(
      query === "" ? "/api/inquiries" : `/api/inquiries?${query}`,
    ),
    apiGet<User[]>("/api/users"),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-bold">お問い合わせ一覧</h1>

      <div className="mb-4">
        <InquiryFilter
          users={users}
          currentStatus={status}
          currentAssigneeId={assigneeId}
        />
      </div>

      <InquiryTable inquiries={inquiries} />
    </main>
  );
}
