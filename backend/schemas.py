from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    operation_id: Annotated[str, StringConstraints(strip_whitespace=True, strict=True)] = Field(
        min_length=1,
        description="Идентификатор операции в активном датасете",
    )


class ExplanationUnavailable(BaseModel):
    status: Literal["unavailable"]
    reason: str = Field(description="Причина, по которой объяснение недоступно")


class PredictionResponse(BaseModel):
    operation_id: str
    request_id: str
    dataset_version: str
    score: float = Field(allow_inf_nan=False)
    threshold: float = Field(allow_inf_nan=False)
    model_version: str
    feature_schema_version: str
    explanation: ExplanationUnavailable


class FieldError(BaseModel):
    field: str
    code: str
    message: str


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: list[FieldError] | None = None


class ErrorResponse(BaseModel):
    request_id: str
    error: ErrorDetail
