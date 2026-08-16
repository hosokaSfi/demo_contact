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
    <ol className="space-y-4">
      {histories.map((history) => (
        <li key={history.id} className="border-l-2 border-gray-200 pl-4">
          <div className="text-xs text-gray-500">
            {new Date(history.created_at).toLocaleString("ja-JP")}
            {history.user_name !== null && ` ・ ${history.user_name}`}
          </div>

          <div className="text-sm">{describe(history)}</div>

          {history.body !== null && (
            <div className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm">
              {history.body}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
