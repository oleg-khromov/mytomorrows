from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TrialModel(Base):
    __tablename__ = "trials"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    condition: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    sponsor: Mapped[str] = mapped_column(String(255), nullable=False)
    phase: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    intervention: Mapped[str] = mapped_column(String(255), nullable=False)
    last_updated: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str] = mapped_column(String(500), nullable=False)

    eligibility: Mapped[list["TrialEligibilityModel"]] = relationship(
        back_populates="trial",
        cascade="all, delete-orphan",
        order_by="TrialEligibilityModel.order_index",
    )
    locations: Mapped[list["TrialLocationModel"]] = relationship(
        back_populates="trial",
        cascade="all, delete-orphan",
        order_by="TrialLocationModel.id",
    )


class TrialEligibilityModel(Base):
    __tablename__ = "trial_eligibility"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trial_id: Mapped[str] = mapped_column(ForeignKey("trials.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    criterion: Mapped[str] = mapped_column(Text, nullable=False)

    trial: Mapped[TrialModel] = relationship(back_populates="eligibility")


class TrialLocationModel(Base):
    __tablename__ = "trial_locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trial_id: Mapped[str] = mapped_column(ForeignKey("trials.id", ondelete="CASCADE"), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    facility: Mapped[str] = mapped_column(String(255), nullable=False)

    trial: Mapped[TrialModel] = relationship(back_populates="locations")
