"use client";

// 公開の問い合わせフォーム。送信すると管理画面の一覧に載る。

import { useState } from "react";

import { apiPost } from "@/lib/api";

type InquiryCreated = {
  id: number;
  subject: string;
  status: string;
  created_at: string;
};

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
      <div className="rounded border border-green-300 bg-green-50 p-6">
        <p className="mb-3 text-sm">お問い合わせを受け付けました。</p>
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => setSent(false)}
        >
          続けて問い合わせる
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm">
        お名前
        <input
          type="text"
          required
          className="mt-1 w-full rounded border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        メールアドレス
        <input
          type="email"
          required
          className="mt-1 w-full rounded border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        件名
        <input
          type="text"
          required
          className="mt-1 w-full rounded border p-2"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        お問い合わせ内容
        <textarea
          required
          rows={6}
          className="mt-1 w-full rounded border p-2"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      {error !== "" && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:bg-gray-300"
      >
        {sending ? "送信中..." : "送信する"}
      </button>
    </form>
  );
}
