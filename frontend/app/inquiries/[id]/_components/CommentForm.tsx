"use client";

// 対応メモを投稿する。投稿した内容は対応履歴に並ぶ。

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOperator } from "./OperatorContext";
import { Button } from "@/app/_components/Button";
import { apiPost } from "@/lib/api";
import type { InquiryHistory } from "@/lib/types";

type Props = {
  inquiryId: number;
};

export function CommentForm({ inquiryId }: Props) {
  const router = useRouter();
  const { operatorId } = useOperator();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (body.trim() === "") {
      return;
    }

    setSaving(true);

    try {
      await apiPost<InquiryHistory>(`/api/inquiries/${inquiryId}/comments`, {
        body,
        user_id: operatorId,
      });
      setBody("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        rows={3}
        placeholder="対応メモを入力"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button type="submit" disabled={saving || body.trim() === ""}>
        {saving ? "投稿中..." : "投稿する"}
      </Button>
    </form>
  );
}
