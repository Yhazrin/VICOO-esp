"""Tonghua API Schemas — re-exports from individual schema modules."""

# Common / base schemas
from app.schemas.common import (
    ApiResponse,
    AuditLogOut,
    DashboardMetrics,
    ForgotPasswordRequest,
    LoginRequest,
    PaginatedResponse,
    RefreshRequest,
    RegisterRequest,
    SettingsUpdate,
    TokenResponse,
)

# User & Child participant
from app.schemas.user import (
    ChildParticipantCreate,
    ChildParticipantOut,
    ChildParticipantUpdate,
    UserCreate,
    UserOut,
    UserOutSensitive,
    UserRoleUpdate,
    UserStatusUpdate,
    UserUpdate,
)

# Artwork
from app.schemas.artwork import (
    ArtworkCreate,
    ArtworkListItem,
    ArtworkOut,
    ArtworkStatusUpdate,
    ArtworkUpdate,
)

# Campaign
from app.schemas.campaign import (
    CampaignCreate,
    CampaignListItem,
    CampaignOut,
    CampaignUpdate,
)

# Donation
from app.schemas.donation import (
    DonationCreate,
    DonationListItem,
    DonationOut,
)

# Product
from app.schemas.product import (
    ProductCreate,
    ProductListItem,
    ProductOut,
    ProductUpdate,
)

# Order
from app.schemas.order import (
    LogisticsEvent,
    OrderCreate,
    OrderItemCreate,
    OrderItemOut,
    OrderListItem,
    OrderLogisticsUpdate,
    OrderOut,
    OrderStatusUpdate,
    ReturnRequestCreate,
    ReturnRequestItem,
)

# Payment
from app.schemas.payment import (
    PaymentCallback,
    PaymentCreate,
    PaymentListItem,
    PaymentOut,
)

# Common payment schemas
from app.schemas.payment_common import (
    WeChatPaymentParams,
)

# Supply chain
from app.schemas.supply_chain import (
    SupplyChainRecordCreate,
    SupplyChainRecordOut,
    SupplyChainRecordUpdate,
    SupplyChainTrace,
)

from app.schemas.circular_commerce import (
    AIChatMessage,
    AIChatRequest,
    AIChatResponse,
    AfterSaleCreate,
    AfterSaleOut,
    AfterSaleStatusUpdate,
    ArtworkAnalysisRequest,
    ArtworkAnalysisResponse,
    ClothingIntakeCreate,
    ClothingIntakeOut,
    ClothingIntakeStatusUpdate,
    ContentModerationRequest,
    ContentModerationResponse,
    ProductReviewCreate,
    ProductReviewOut,
    PublishFromIntakeBody,
)

# Settings
from app.schemas.settings import (
    SettingsOut,
    SettingsBulkUpdate,
)

# Contact
from app.schemas.contact import (
    ContactFormCreate,
    ContactMessageOut,
)

# Editorial
from app.schemas.editorial import (
    EditorialArticleOut,
    EditorialArticleCreate,
)

# Address
from app.schemas.address import (
    AddressCreate,
    AddressOut,
    AddressUpdate,
)
from app.schemas.impact_fund import ImpactFundEntryOut
from app.schemas.design_draft import DesignDraftCreate, DesignDraftUpdate, DesignDraftOut

__all__ = [
    # Common
    "ApiResponse",
    "PaginatedResponse",
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "RefreshRequest",
    "AuditLogOut",
    "DashboardMetrics",
    "SettingsUpdate",
    # User
    "UserCreate",
    "UserUpdate",
    "UserOut",
    "UserOutSensitive",
    "UserRoleUpdate",
    "UserStatusUpdate",
    "ChildParticipantCreate",
    "ChildParticipantUpdate",
    "ChildParticipantOut",
    # Artwork
    "ArtworkCreate",
    "ArtworkUpdate",
    "ArtworkStatusUpdate",
    "ArtworkListItem",
    "ArtworkOut",
    # Campaign
    "CampaignCreate",
    "CampaignUpdate",
    "CampaignListItem",
    "CampaignOut",
    # Donation
    "DonationCreate",
    "DonationListItem",
    "DonationOut",
    # Product
    "ProductCreate",
    "ProductUpdate",
    "ProductListItem",
    "ProductOut",
    # Order
    "OrderCreate",
    "OrderItemCreate",
    "OrderItemOut",
    "OrderStatusUpdate",
    "OrderListItem",
    "OrderOut",
    "LogisticsEvent",
    "OrderLogisticsUpdate",
    "ReturnRequestCreate",
    "ReturnRequestItem",
    "WeChatPaymentParams",
    # Payment
    "PaymentCreate",
    "PaymentCallback",
    "PaymentListItem",
    "PaymentOut",
    # Supply chain
    "SupplyChainRecordCreate",
    "SupplyChainRecordUpdate",
    "SupplyChainRecordOut",
    "SupplyChainTrace",
    "ClothingIntakeCreate",
    "ClothingIntakeOut",
    "ClothingIntakeStatusUpdate",
    "PublishFromIntakeBody",
    "ProductReviewCreate",
    "ProductReviewOut",
    "AfterSaleCreate",
    "AfterSaleOut",
    "AfterSaleStatusUpdate",
    "AIChatMessage",
    "AIChatRequest",
    "AIChatResponse",
    "ArtworkAnalysisRequest",
    "ArtworkAnalysisResponse",
    "ContentModerationRequest",
    "ContentModerationResponse",
    # Settings
    "SettingsOut",
    "SettingsBulkUpdate",
    # Contact
    "ContactFormCreate",
    "ContactMessageOut",
    # Editorial
    "EditorialArticleOut",
    "EditorialArticleCreate",
    # Address
    "AddressCreate",
    "AddressOut",
    "AddressUpdate",
    # Impact fund
    "ImpactFundEntryOut",
    # Design draft
    "DesignDraftCreate",
    "DesignDraftUpdate",
    "DesignDraftOut",
]
