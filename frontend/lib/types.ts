// 複数の画面で使うAPIレスポンスの型。
// 1つの画面でしか使わない型は、その画面のファイルに置く。

export type InquiryStatus = "open" | "in_progress" | "pending" | "closed";

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  open: "未対応",
  in_progress: "対応中",
  pending: "保留",
  closed: "完了",
};

export type User = {
  id: number;
  name: string;
  email: string;
};

export type InquiryListItem = {
  id: number;
  subject: string;
  name: string;
  status: InquiryStatus;
  assignee: User | null;
  created_at: string;
};

export type InquiryHistory = {
  id: number;
  entry_type: "comment" | "status_changed" | "assignee_changed";
  body: string | null;
  from_value: string | null;
  to_value: string | null;
  user_name: string | null;
  created_at: string;
};

export type InquiryDetail = {
  id: number;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: InquiryStatus;
  assignee: User | null;
  created_at: string;
  updated_at: string;
  histories: InquiryHistory[];
};
