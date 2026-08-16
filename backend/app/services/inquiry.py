# お問い合わせの業務ロジック。
# ステータスと担当者の変更では、履歴を自動で記録する。
# commit()はこの層でだけ呼び、1リクエストの書き込みを1つにまとめる。

from enum import StrEnum

from app.models.inquiry import Inquiry
from app.models.inquiry_history import HistoryEntryType, InquiryHistory
from app.repositories.inquiry import InquiryRepository
from app.repositories.inquiry_history import InquiryHistoryRepository
from app.repositories.user import UserRepository


class AssigneeUpdateError(StrEnum):
    """担当者の割り当てが失敗した理由。routersがHTTPステータスに変換する。"""

    INQUIRY_NOT_FOUND = "inquiry_not_found"
    USER_NOT_FOUND = "user_not_found"


class InquiryService:
    def __init__(
        self,
        repository: InquiryRepository,
        history_repository: InquiryHistoryRepository,
        user_repository: UserRepository,
    ) -> None:
        self.repository = repository
        self.history_repository = history_repository
        self.user_repository = user_repository

    def list_inquiries(
        self, status: str | None = None, assignee_id: int | None = None
    ) -> list[Inquiry]:
        return self.repository.find_all(status=status, assignee_id=assignee_id)

    def get_inquiry(self, inquiry_id: int) -> Inquiry | None:
        return self.repository.find_by_id(inquiry_id)

    def get_histories(self, inquiry_id: int) -> list[InquiryHistory]:
        return self.history_repository.find_by_inquiry_id(inquiry_id)

    def create_inquiry(
        self, name: str, email: str, subject: str, body: str
    ) -> Inquiry:
        inquiry = Inquiry(
            name=name, email=email, subject=subject, body=body, status="open"
        )
        self.repository.add(inquiry)
        self.repository.db.commit()
        self.repository.db.refresh(inquiry)
        return inquiry

    def update_status(
        self, inquiry_id: int, status: str, user_id: int | None
    ) -> Inquiry | None:
        inquiry = self.repository.find_by_id(inquiry_id)

        if inquiry is None:
            return None

        # 値が変わらないときは履歴を残さない。
        # 同じ状態を選び直しただけでタイムラインが埋まるのを防ぐため。
        if inquiry.status != status:
            self.history_repository.add(
                InquiryHistory(
                    inquiry_id=inquiry.id,
                    entry_type=HistoryEntryType.STATUS_CHANGED,
                    from_value=inquiry.status,
                    to_value=status,
                    user_id=user_id,
                )
            )
            inquiry.status = status

        self.repository.db.commit()
        self.repository.db.refresh(inquiry)
        return inquiry

    def update_assignee(
        self, inquiry_id: int, assignee_id: int | None, user_id: int | None
    ) -> tuple[Inquiry | None, AssigneeUpdateError | None]:
        """更新結果と失敗理由を組で返す。

        「お問い合わせが無い」と「担当者が無い」でHTTPステータスが変わるため、
        Noneだけではrouters側が区別できない。例外クラスは作らずここで表す。
        """
        inquiry = self.repository.find_by_id(inquiry_id)

        if inquiry is None:
            return None, AssigneeUpdateError.INQUIRY_NOT_FOUND

        new_assignee = None

        if assignee_id is not None:
            new_assignee = self.user_repository.find_by_id(assignee_id)

            if new_assignee is None:
                return None, AssigneeUpdateError.USER_NOT_FOUND

        if inquiry.assignee_id != assignee_id:
            # 履歴には表示名を入れる。あとで担当者名が変わっても記録は当時のまま。
            self.history_repository.add(
                InquiryHistory(
                    inquiry_id=inquiry.id,
                    entry_type=HistoryEntryType.ASSIGNEE_CHANGED,
                    from_value=(
                        inquiry.assignee.name if inquiry.assignee is not None else None
                    ),
                    to_value=(
                        new_assignee.name if new_assignee is not None else None
                    ),
                    user_id=user_id,
                )
            )
            inquiry.assignee_id = assignee_id

        self.repository.db.commit()
        self.repository.db.refresh(inquiry)
        return inquiry, None

    def add_comment(
        self, inquiry_id: int, body: str, user_id: int
    ) -> InquiryHistory | None:
        inquiry = self.repository.find_by_id(inquiry_id)

        if inquiry is None:
            return None

        history = self.history_repository.add(
            InquiryHistory(
                inquiry_id=inquiry.id,
                entry_type=HistoryEntryType.COMMENT,
                body=body,
                user_id=user_id,
            )
        )
        self.repository.db.commit()
        self.repository.db.refresh(history)
        return history
