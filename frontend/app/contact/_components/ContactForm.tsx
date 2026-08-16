"use client";

// 公開の問い合わせフォーム。送信すると管理画面の一覧に載る。

import { useState } from "react";
import { CheckCircle } from "lucide-react";

import { Button } from "@/app/_components/Button";
import { Card } from "@/app/_components/Card";
import { apiPost } from "@/lib/api";

type InquiryCreated = {
  id: number;
  subject: string;
  status: string;
  created_at: string;
};

const inputClasses =
  "mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      await apiPost<InquiryCreated>("/api/inquiries", {
        name,
        email,
        subject,
        body,
      });
      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setBody("");
    } catch {
      setError("送信に失敗しました。入力内容を確認してください。");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Card className="flex flex-col items-center text-center">
        <CheckCircle className="mb-3 h-10 w-10 text-green-600" />
        <p className="mb-4 text-sm text-gray-700">
          お問い合わせを受け付けました。
        </p>
        <Button variant="secondary" type="button" onClick={() => setSent(false)}>
          続けて問い合わせる
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="mb-1 text-xl font-bold text-gray-900">
        お問い合わせフォーム
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        必要事項をご入力の上、送信してください。
      </p>

      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          お名前
          <input
            type="text"
            required
            className={inputClasses}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          メールアドレス
          <input
            type="email"
            required
            className={inputClasses}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          件名
          <input
            type="text"
            required
            className={inputClasses}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          お問い合わせ内容
          <textarea
            required
            rows={6}
            className={inputClasses}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>

        {error !== "" && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={sending} className="w-full">
          {sending ? "送信中..." : "送信する"}
        </Button>
      </form>
    </Card>
  );
}
