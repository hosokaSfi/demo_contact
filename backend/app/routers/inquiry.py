# お問い合わせAPIのHTTP入出力。
# 業務的な失敗はServiceの戻り値で受け取り、ここでHTTPExceptionに変換する。

from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.inquiry import Inquiry
from app.models.inquiry_history import InquiryHistory
from app.repositories.inquiry import InquiryRepository
from app.repositories.inquiry_history import InquiryHistoryRepository
from app.repositories.user import UserRepository
from app.schemas.inquiry import (
    InquiryAssigneeUpdate,
    InquiryCreate,
    InquiryDetail,
    InquiryListItem,
    InquiryResponse,
    InquiryStatus,
    InquiryStatusUpdate,
)
from app.schemas.inquiry_history import CommentCreate, InquiryHistoryResponse
from app.services.inquiry import AssigneeUpdateError, InquiryService

router = APIRouter(prefix="/api/inquiries", tags=["inquiries"])


def get_inquiry_service(db: Session = Depends(get_db)) -> InquiryService:
    return InquiryService(
        InquiryRepository(db),
        InquiryHistoryRepository(db),
        UserRepository(db),
    )


def to_history_response(history: InquiryHistory) -> InquiryHistoryResponse:
    """履歴のモデルをレスポンスに詰め替える。user_nameはリレーションから取る。"""
    return InquiryHistoryResponse(
        id=history.id,
        entry_type=history.entry_type,
        body=history.body,
        from_value=history.from_value,
        to_value=history.to_value,
        user_name=history.user.name if history.user is not None else None,
        created_at=history.created_at,
    )


def to_detail(inquiry: Inquiry, histories: list[InquiryHistory]) -> InquiryDetail:
    return InquiryDetail(
        id=inquiry.id,
        name=inquiry.name,
        email=inquiry.email,
        subject=inquiry.subject,
        body=inquiry.body,
        status=InquiryStatus(inquiry.status),
        assignee=inquiry.assignee,
        created_at=inquiry.created_at,
        updated_at=inquiry.updated_at,
        histories=[to_history_response(h) for h in histories],
    )


@router.get("", response_model=list[InquiryListItem])
def list_inquiries(
    status: InquiryStatus | None = None,
    assignee_id: int | None = None,
    service: InquiryService = Depends(get_inquiry_service),
) -> list[InquiryListItem]:
    inquiries = service.list_inquiries(status=status, assignee_id=assignee_id)
    return [InquiryListItem.model_validate(i) for i in inquiries]


@router.get("/{inquiry_id}", response_model=InquiryDetail)
def get_inquiry(
    inquiry_id: int, service: InquiryService = Depends(get_inquiry_service)
) -> InquiryDetail:
    inquiry = service.get_inquiry(inquiry_id)

    if inquiry is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="お問い合わせが見つかりません",
        )

    return to_detail(inquiry, service.get_histories(inquiry_id))


@router.post(
    "", response_model=InquiryResponse, status_code=http_status.HTTP_201_CREATED
)
def create_inquiry(
    payload: InquiryCreate, service: InquiryService = Depends(get_inquiry_service)
) -> InquiryResponse:
    inquiry = service.create_inquiry(
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        body=payload.body,
    )
    return InquiryResponse.model_validate(inquiry)


@router.patch("/{inquiry_id}/status", response_model=InquiryDetail)
def update_status(
    inquiry_id: int,
    payload: InquiryStatusUpdate,
    user_id: int | None = None,
    service: InquiryService = Depends(get_inquiry_service),
) -> InquiryDetail:
    inquiry = service.update_status(inquiry_id, payload.status, user_id)

    if inquiry is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="お問い合わせが見つかりません",
        )

    return to_detail(inquiry, service.get_histories(inquiry_id))


@router.patch("/{inquiry_id}/assignee", response_model=InquiryDetail)
def update_assignee(
    inquiry_id: int,
    payload: InquiryAssigneeUpdate,
    user_id: int | None = None,
    service: InquiryService = Depends(get_inquiry_service),
) -> InquiryDetail:
    inquiry, error = service.update_assignee(inquiry_id, payload.assignee_id, user_id)

    if error is AssigneeUpdateError.INQUIRY_NOT_FOUND:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="お問い合わせが見つかりません",
        )

    if error is AssigneeUpdateError.USER_NOT_FOUND:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="指定された担当者が見つかりません",
        )

    if inquiry is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="お問い合わせが見つかりません",
        )

    return to_detail(inquiry, service.get_histories(inquiry_id))


@router.post(
    "/{inquiry_id}/comments",
    response_model=InquiryHistoryResponse,
    status_code=http_status.HTTP_201_CREATED,
)
def add_comment(
    inquiry_id: int,
    payload: CommentCreate,
    service: InquiryService = Depends(get_inquiry_service),
) -> InquiryHistoryResponse:
    history = service.add_comment(inquiry_id, payload.body, payload.user_id)

    if history is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="お問い合わせが見つかりません",
        )

    return to_history_response(history)
