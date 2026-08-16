# UIリッチ化・デザインリニューアル Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4画面（トップ / お問い合わせフォーム / 一覧 / 詳細）を、インディゴ系アクセントカラー・角丸カード・共通ヘッダーを持つリッチなデザインに刷新する。機能・API・状態遷移ロジックは一切変更しない。

**Architecture:** `app/_components/` に `Button` / `Card` / `PageHeader` を新規追加し、既存の `StatusBadge` を配色更新する。管理画面（`/inquiries` 系）には `app/inquiries/layout.tsx` で共通ヘッダーを適用する。各画面・各コンポーネントはこれらの共通パーツを使って再構成する。

**Tech Stack:** Next.js 16 App Router / React 19 / TypeScript / Tailwind CSS v4 / `lucide-react`（新規導入するアイコンライブラリ）

**設計書:** `docs/superpowers/specs/2026-08-16-ui-redesign-design.md`

---

### Task 1: セットアップ（lucide-react導入・ダークモード無効化）

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/app/globals.css`

- [ ] **Step 1: lucide-reactをインストールする**

```bash
cd frontend && npm install lucide-react
```

Expected: `package.json` の `dependencies` に `"lucide-react"` が追加される

- [ ] **Step 2: ダークモード自動切り替えを無効化する**

設計書で「ダークモード非対応（ライトモードのみ）」と決めたため、`prefers-color-scheme: dark` によるOS追従を止める。`frontend/app/globals.css` を次のように書き換える（`@media (prefers-color-scheme: dark)` ブロックを削除）。

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

- [ ] **Step 3: 型チェックが通ることを確認する**

```bash
cd frontend && npx tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add frontend/package.json frontend/package-lock.json frontend/app/globals.css
git commit -m "chore: lucide-reactを導入しダークモード自動切り替えを無効化"
```

---

### Task 2: StatusBadgeの配色をソフトトーンに更新

**Files:**
- Modify: `frontend/app/_components/StatusBadge.tsx`

- [ ] **Step 1: 配色を書き換える**

`frontend/app/_components/StatusBadge.tsx` の中身を次に置き換える。

```tsx
// ステータスを色付きのバッジで表示する。一覧と詳細の両方で使う。

import { STATUS_LABELS, type InquiryStatus } from "@/lib/types";

const STATUS_CLASSES: Record<InquiryStatus, string> = {
  open: "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20",
  in_progress: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  pending: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20",
  closed: "bg-green-50 text-green-700 ring-1 ring-green-600/20",
};

type Props = {
  status: InquiryStatus;
};

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
```

- [ ] **Step 2: 型チェックとlintを確認する**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add frontend/app/_components/StatusBadge.tsx
git commit -m "style: StatusBadgeをソフトトーン配色に更新"
```

---

### Task 3: Button共通コンポーネントを作成する

**Files:**
- Create: `frontend/app/_components/Button.tsx`

- [ ] **Step 1: Buttonコンポーネントを作成する**

```tsx
// 塗り(primary)と枠線(secondary)の2種類のボタン。フォームの送信・操作ボタンで使う。

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

const VARIANT_CLASSES: Record<"primary" | "secondary", string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
};

export function Button({ variant = "primary", className = "", ...rest }: Props) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    />
  );
}
```

- [ ] **Step 2: 型チェックを確認する**

```bash
cd frontend && npx tsc --noEmit
```

Expected: エラーなし（この時点ではまだどこからも使われていない）

- [ ] **Step 3: コミット**

```bash
git add frontend/app/_components/Button.tsx
git commit -m "feat: 共通Buttonコンポーネントを追加"
```

---

### Task 4: Card共通コンポーネントを作成する

**Files:**
- Create: `frontend/app/_components/Card.tsx`

- [ ] **Step 1: Cardコンポーネントを作成する**

```tsx
// 角丸・薄い影のカード。hoverableを指定するとホバー時に浮き上がる。

import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
};

export function Card({ hoverable = false, className = "", ...rest }: Props) {
  const hoverClasses = hoverable
    ? "transition hover:-translate-y-0.5 hover:shadow-md"
    : "";

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${hoverClasses} ${className}`}
      {...rest}
    />
  );
}
```

- [ ] **Step 2: 型チェックを確認する**

```bash
cd frontend && npx tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add frontend/app/_components/Card.tsx
git commit -m "feat: 共通Cardコンポーネントを追加"
```

---

### Task 5: PageHeader共通コンポーネントを作成する

**Files:**
- Create: `frontend/app/_components/PageHeader.tsx`

- [ ] **Step 1: PageHeaderコンポーネントを作成する**

```tsx
// 管理画面（/inquiries系）の共通ヘッダー。ロゴとトップへの導線、必要なら戻るリンクを表示する。

import Link from "next/link";
import { Inbox } from "lucide-react";

type Props = {
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({ backHref, backLabel }: Props) {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Inbox className="h-4 w-4" />
          </span>
          <span className="font-bold text-gray-900">お問い合わせ管理</span>
        </Link>

        {backHref !== undefined && (
          <Link
            href={backHref}
            className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            {backLabel ?? "一覧に戻る"}
          </Link>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 型チェックを確認する**

```bash
cd frontend && npx tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add frontend/app/_components/PageHeader.tsx
git commit -m "feat: 共通PageHeaderコンポーネントを追加"
```

---

### Task 6: トップページを刷新する

**Files:**
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: トップページを書き換える**

```tsx
// トップページ。管理画面と問い合わせフォームへの入口。

import Link from "next/link";
import { ArrowRight, Inbox, MessageSquarePlus } from "lucide-react";

import { Card } from "./_components/Card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-indigo-50 via-white to-white px-8 py-16">
      <div className="mb-12 flex flex-col items-center text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Inbox className="h-6 w-6" />
        </span>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
          お問い合わせ管理システム
        </h1>
        <p className="text-gray-500">
          お問い合わせを受け付け、履歴を残しながら対応するためのツール
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        <Link href="/inquiries">
          <Card hoverable className="h-full">
            <Inbox className="mb-3 h-6 w-6 text-indigo-600" />
            <div className="mb-1 font-semibold text-gray-900">
              お問い合わせ一覧
            </div>
            <p className="mb-4 text-sm text-gray-500">
              受け付けたお問い合わせを確認し、対応する
            </p>
            <span className="flex items-center gap-1 text-sm font-medium text-indigo-600">
              開く
              <ArrowRight className="h-4 w-4" />
            </span>
          </Card>
        </Link>

        <Link href="/contact">
          <Card hoverable className="h-full">
            <MessageSquarePlus className="mb-3 h-6 w-6 text-indigo-600" />
            <div className="mb-1 font-semibold text-gray-900">
              お問い合わせフォーム
            </div>
            <p className="mb-4 text-sm text-gray-500">
              お問い合わせを送信する（利用者向け）
            </p>
            <span className="flex items-center gap-1 text-sm font-medium text-indigo-600">
              開く
              <ArrowRight className="h-4 w-4" />
            </span>
          </Card>
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 型チェックとlintを確認する**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add frontend/app/page.tsx
git commit -m "style: トップページをヒーロー+カード構成にリニューアル"
```

---

### Task 7: お問い合わせフォームを刷新する

**Files:**
- Modify: `frontend/app/contact/page.tsx`
- Modify: `frontend/app/contact/_components/ContactForm.tsx`

- [ ] **Step 1: contact/page.tsxを確認し、背景とレイアウトを整える**

`frontend/app/contact/page.tsx` の現在の中身を読み、`<main>` のクラスを次のパターンに合わせて書き換える（既存の見出しやコンポーネント呼び出し自体は変更しない）。

```tsx
<main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-indigo-50 via-white to-white px-8 py-16">
  <div className="w-full max-w-xl">
    {/* 既存の見出し・ContactForm呼び出しはそのまま */}
  </div>
</main>
```

- [ ] **Step 2: ContactFormをCard化し、Buttonを使うよう書き換える**

`frontend/app/contact/_components/ContactForm.tsx` の中身を次に置き換える。

```tsx
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
```

- [ ] **Step 3: 型チェックとlintを確認する**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add frontend/app/contact
git commit -m "style: お問い合わせフォームをCard+Button構成にリニューアル"
```

---

### Task 8: 一覧・詳細画面に共通ヘッダーを適用するlayoutを作成する

**Files:**
- Create: `frontend/app/inquiries/layout.tsx`
- Modify: `frontend/app/inquiries/page.tsx`
- Modify: `frontend/app/inquiries/[id]/page.tsx`

- [ ] **Step 1: layout.tsxを作成する**

`/inquiries` 配下（一覧・詳細）共通のヘッダーはURLごとに出し分けが必要（詳細では「一覧に戻る」を表示）なため、layoutではラップのみ行い、`backHref`の出し分けは各pageで担当する。ここでは背景色の共通化のみlayoutに持たせる。

```tsx
// /inquiries 配下（一覧・詳細）の共通レイアウト。背景色を揃える。

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function InquiriesLayout({ children }: Props) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
```

- [ ] **Step 2: 一覧ページにPageHeaderを追加し、リッチなレイアウトに書き換える**

`frontend/app/inquiries/page.tsx` の中身を次に置き換える。

```tsx
// お問い合わせ一覧のページ。絞り込み条件はURLのクエリから読む。

import { InquiryFilter } from "./_components/InquiryFilter";
import { InquiryTable } from "./_components/InquiryTable";
import { PageHeader } from "@/app/_components/PageHeader";
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
    <>
      <PageHeader />

      <main className="mx-auto max-w-5xl p-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            お問い合わせ一覧
          </h1>
          <span className="text-sm text-gray-500">{inquiries.length}件</span>
        </div>

        <div className="mb-4">
          <InquiryFilter
            users={users}
            currentStatus={status}
            currentAssigneeId={assigneeId}
          />
        </div>

        <InquiryTable inquiries={inquiries} />
      </main>
    </>
  );
}
```

- [ ] **Step 3: 詳細ページにPageHeaderを追加し、既存の戻りリンクを削除する**

`frontend/app/inquiries/[id]/page.tsx` の中身を次に置き換える。

```tsx
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
```

- [ ] **Step 4: 型チェックとlintを確認する**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add frontend/app/inquiries/layout.tsx frontend/app/inquiries/page.tsx frontend/app/inquiries/[id]/page.tsx
git commit -m "style: 一覧・詳細画面に共通PageHeaderを適用"
```

---

### Task 9: InquiryFilterのセレクトをリッチなスタイルに更新する

**Files:**
- Modify: `frontend/app/inquiries/_components/InquiryFilter.tsx`

- [ ] **Step 1: セレクトのクラスとラップをCard風に更新する**

`frontend/app/inquiries/_components/InquiryFilter.tsx` の中身を次に置き換える。

```tsx
"use client";

// 一覧の絞り込み。選んだらURLのクエリを書き換えるだけで、状態は持たない。

import { useRouter } from "next/navigation";

import { Card } from "@/app/_components/Card";
import { STATUS_LABELS, type InquiryStatus, type User } from "@/lib/types";

type Props = {
  users: User[];
  currentStatus: string;
  currentAssigneeId: string;
};

const STATUSES: InquiryStatus[] = ["open", "in_progress", "pending", "closed"];

const selectClasses =
  "rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export function InquiryFilter({ users, currentStatus, currentAssigneeId }: Props) {
  const router = useRouter();

  const move = (status: string, assigneeId: string) => {
    const params = new URLSearchParams();

    if (status !== "") {
      params.set("status", status);
    }

    if (assigneeId !== "") {
      params.set("assignee_id", assigneeId);
    }

    const query = params.toString();
    router.push(query === "" ? "/inquiries" : `/inquiries?${query}`);
  };

  return (
    <Card className="flex flex-wrap gap-4 p-4">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        対応状況
        <select
          className={selectClasses}
          value={currentStatus}
          onChange={(e) => move(e.target.value, currentAssigneeId)}
        >
          <option value="">すべて</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        担当者
        <select
          className={selectClasses}
          value={currentAssigneeId}
          onChange={(e) => move(currentStatus, e.target.value)}
        >
          <option value="">すべて</option>
          {users.map((user) => (
            <option key={user.id} value={String(user.id)}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
}
```

- [ ] **Step 2: 型チェックとlintを確認する**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add frontend/app/inquiries/_components/InquiryFilter.tsx
git commit -m "style: InquiryFilterをCard化しセレクトのスタイルを統一"
```

---

### Task 10: InquiryTableをCard化し、空状態を追加する

**Files:**
- Modify: `frontend/app/inquiries/_components/InquiryTable.tsx`

- [ ] **Step 1: テーブルをCardで囲み、配色を更新する**

`frontend/app/inquiries/_components/InquiryTable.tsx` の中身を次に置き換える。

```tsx
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
    <Card className="overflow-x-auto p-0">
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
```

- [ ] **Step 2: 型チェックとlintを確認する**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add frontend/app/inquiries/_components/InquiryTable.tsx
git commit -m "style: InquiryTableをCard化し空状態を追加"
```

---

### Task 11: InquiryDetailCardをCard化する

**Files:**
- Modify: `frontend/app/inquiries/[id]/_components/InquiryDetailCard.tsx`

- [ ] **Step 1: 共通Cardを使うように書き換える**

`frontend/app/inquiries/[id]/_components/InquiryDetailCard.tsx` の中身を次に置き換える。

```tsx
// お問い合わせの内容を表示する。表示だけなのでServer Component。

import { Card } from "@/app/_components/Card";
import { StatusBadge } from "@/app/_components/StatusBadge";
import type { InquiryDetail } from "@/lib/types";

type Props = {
  inquiry: InquiryDetail;
};

export function InquiryDetailCard({ inquiry }: Props) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {inquiry.subject}
        </h1>
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

      <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm">
        {inquiry.body}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: 型チェックとlintを確認する**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add "frontend/app/inquiries/[id]/_components/InquiryDetailCard.tsx"
git commit -m "style: InquiryDetailCardをCard化"
```

---

### Task 12: セレクト系コンポーネントのスタイルを統一する

**Files:**
- Modify: `frontend/app/inquiries/[id]/_components/OperatorSelect.tsx`
- Modify: `frontend/app/inquiries/[id]/_components/StatusSelect.tsx`
- Modify: `frontend/app/inquiries/[id]/_components/AssigneeSelect.tsx`

- [ ] **Step 1: OperatorSelectのクラスを更新する**

`frontend/app/inquiries/[id]/_components/OperatorSelect.tsx` 内の `<select>` の `className` を次に置き換える（構造・ロジックは変更しない）。

```tsx
className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
```

- [ ] **Step 2: StatusSelectのクラスを更新する**

`frontend/app/inquiries/[id]/_components/StatusSelect.tsx` 内の `<select>` の `className` を同じクラス文字列に置き換える。

```tsx
className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
```

- [ ] **Step 3: AssigneeSelectのクラスを更新する**

`frontend/app/inquiries/[id]/_components/AssigneeSelect.tsx` 内の `<select>` の `className` を同じクラス文字列に置き換える。

```tsx
className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
```

- [ ] **Step 4: 型チェックとlintを確認する**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add "frontend/app/inquiries/[id]/_components/OperatorSelect.tsx" "frontend/app/inquiries/[id]/_components/StatusSelect.tsx" "frontend/app/inquiries/[id]/_components/AssigneeSelect.tsx"
git commit -m "style: 対応セクションのセレクトのスタイルを統一"
```

---

### Task 13: CommentFormをButton化する

**Files:**
- Modify: `frontend/app/inquiries/[id]/_components/CommentForm.tsx`

- [ ] **Step 1: textareaのスタイルと送信ボタンを共通Buttonに置き換える**

`frontend/app/inquiries/[id]/_components/CommentForm.tsx` の中身を次に置き換える。

```tsx
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
```

- [ ] **Step 2: 型チェックとlintを確認する**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add "frontend/app/inquiries/[id]/_components/CommentForm.tsx"
git commit -m "style: CommentFormを共通Buttonに置き換え"
```

---

### Task 14: HistoryTimelineをタイムライン風に装飾する

**Files:**
- Modify: `frontend/app/inquiries/[id]/_components/HistoryTimeline.tsx`

- [ ] **Step 1: 縦線+丸ドットの装飾を追加する**

`frontend/app/inquiries/[id]/_components/HistoryTimeline.tsx` の中身を次に置き換える（`statusLabel`・`describe`のロジックは変更しない）。

```tsx
// 対応履歴を時系列で表示する。
// コメントと変更ログが同じ配列で来るので、entry_typeで表示を分ける。

import { STATUS_LABELS, type InquiryHistory } from "@/lib/types";

// DBに入っている値は文字列なので、asでキャストせずに突き合わせる。
// 見つからなければ、その値をそのまま表示する。
function statusLabel(value: string | null): string {
  if (value === null) {
    return "なし";
  }

  const found = Object.entries(STATUS_LABELS).find(([key]) => key === value);
  return found === undefined ? value : found[1];
}

function describe(history: InquiryHistory): string {
  if (history.entry_type === "status_changed") {
    return `対応状況を「${statusLabel(history.from_value)}」から「${statusLabel(history.to_value)}」に変更`;
  }

  if (history.entry_type === "assignee_changed") {
    const from = history.from_value ?? "未割り当て";
    const to = history.to_value ?? "未割り当て";
    return `担当者を「${from}」から「${to}」に変更`;
  }

  return "コメントを投稿";
}

type Props = {
  histories: InquiryHistory[];
};

export function HistoryTimeline({ histories }: Props) {
  if (histories.length === 0) {
    return <p className="text-sm text-gray-500">まだ対応履歴がありません。</p>;
  }

  return (
    <ol className="space-y-6">
      {histories.map((history, index) => (
        <li key={history.id} className="relative pl-6">
          <span className="absolute top-1 left-0 h-2 w-2 rounded-full bg-indigo-600" />
          {index !== histories.length - 1 && (
            <span className="absolute top-3 left-[3px] h-[calc(100%+0.5rem)] w-px bg-gray-200" />
          )}

          <div className="text-xs text-gray-500">
            {new Date(history.created_at).toLocaleString("ja-JP")}
            {history.user_name !== null && ` ・ ${history.user_name}`}
          </div>

          <div className="text-sm text-gray-900">{describe(history)}</div>

          {history.body !== null && (
            <div className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm">
              {history.body}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 2: 型チェックとlintを確認する**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add "frontend/app/inquiries/[id]/_components/HistoryTimeline.tsx"
git commit -m "style: HistoryTimelineをタイムライン風に装飾"
```

---

### Task 15: 全体の最終検証

**Files:** なし（検証のみ）

- [ ] **Step 1: 型チェック・lint・buildを通す**

```bash
cd frontend && npx tsc --noEmit
cd frontend && npm run lint
cd frontend && npm run build
```

Expected: すべてエラーなし

- [ ] **Step 2: バックエンドの疎通を確認する**

```bash
make health
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: ブラウザで4画面を確認する**

`make dev`（または `cd frontend && npm run dev`）でフロントを起動し、以下を確認する。

1. `/` — ヒーロー＋2枚のカードが表示され、崩れがない
2. `/contact` — フォームが1枚のCardに収まり、送信できる。送信後の完了表示が正しい
3. `/inquiries` — PageHeaderが表示され、フィルターとテーブルがCard化されている。絞り込みが機能する
4. `/inquiries/[id]` — PageHeaderの「一覧に戻る」で一覧に戻れる。ステータス変更・担当者割り当て・対応メモ投稿が引き続き動作し、対応履歴がタイムライン表示される

- [ ] **Step 4: 最終コミット（差分があれば）**

検証中に軽微な修正を行った場合のみ、まとめてコミットする。

```bash
git status
```

Expected: 差分がなければコミット不要。差分があれば内容を確認した上でコミットする。

---
