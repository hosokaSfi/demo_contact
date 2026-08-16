# 起動時に動作確認用のデータを入れる。
# usersが0件のときだけ実行するので、再起動しても重複しない。

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inquiry import Inquiry
from app.models.inquiry_history import HistoryEntryType, InquiryHistory
from app.models.user import User

USERS = [
    {"name": "佐藤 太郎", "email": "sato@example.com"},
    {"name": "鈴木 花子", "email": "suzuki@example.com"},
    {"name": "高橋 次郎", "email": "takahashi@example.com"},
]

INQUIRIES = [
    {
        "name": "山田 一郎",
        "email": "yamada@example.com",
        "subject": "ログインできない",
        "body": "パスワードを再設定しましたが、ログイン画面でエラーになります。",
        "status": "open",
        "assignee_index": None,
    },
    {
        "name": "田中 美咲",
        "email": "tanaka@example.com",
        "subject": "請求書の再発行をお願いしたい",
        "body": "先月分の請求書を紛失しました。再発行は可能でしょうか。",
        "status": "in_progress",
        "assignee_index": 0,
    },
    {
        "name": "伊藤 健",
        "email": "ito@example.com",
        "subject": "アカウントの解約について",
        "body": "解約の手順を教えてください。データはどうなりますか。",
        "status": "pending",
        "assignee_index": 1,
    },
    {
        "name": "渡辺 さくら",
        "email": "watanabe@example.com",
        "subject": "機能の追加要望",
        "body": "CSVの一括取り込みができると助かります。",
        "status": "closed",
        "assignee_index": 2,
    },
    {
        "name": "中村 大輔",
        "email": "nakamura@example.com",
        "subject": "画面の表示が崩れる",
        "body": "スマートフォンで開くと、表がはみ出して読めません。",
        "status": "open",
        "assignee_index": None,
    },
]


def seed(db: Session) -> None:
    """動作確認用のデータを入れる。すでにusersがあれば何もしない。"""
    if db.scalars(select(User)).first() is not None:
        return

    users = [User(name=u["name"], email=u["email"]) for u in USERS]
    db.add_all(users)
    db.flush()

    for item in INQUIRIES:
        index = item["assignee_index"]
        assignee = users[index] if index is not None else None
        inquiry = Inquiry(
            name=item["name"],
            email=item["email"],
            subject=item["subject"],
            body=item["body"],
            status=item["status"],
            assignee_id=assignee.id if assignee is not None else None,
        )
        db.add(inquiry)
        db.flush()

        # 担当者がいるものには、割り当ての履歴を残しておく。
        if assignee is not None:
            db.add(
                InquiryHistory(
                    inquiry_id=inquiry.id,
                    entry_type=HistoryEntryType.ASSIGNEE_CHANGED,
                    from_value=None,
                    to_value=assignee.name,
                    user_id=assignee.id,
                )
            )

        # 未対応以外のものには、ステータス変更とコメントを残しておく。
        if item["status"] != "open" and assignee is not None:
            db.add(
                InquiryHistory(
                    inquiry_id=inquiry.id,
                    entry_type=HistoryEntryType.STATUS_CHANGED,
                    from_value="open",
                    to_value=item["status"],
                    user_id=assignee.id,
                )
            )
            db.add(
                InquiryHistory(
                    inquiry_id=inquiry.id,
                    entry_type=HistoryEntryType.COMMENT,
                    body="お問い合わせありがとうございます。確認いたします。",
                    user_id=assignee.id,
                )
            )

    db.commit()
