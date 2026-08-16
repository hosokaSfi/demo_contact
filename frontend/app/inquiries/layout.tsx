// /inquiries 配下（一覧・詳細）の共通レイアウト。背景色を揃える。

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function InquiriesLayout({ children }: Props) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
