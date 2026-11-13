from datetime import datetime
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

REQUIRED_CHECKS = {
    "v1": {
        "top_k_coverage",
        "contribution_direction",
        "numeric_consistency",
        "no_new_factors",
    }
}


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    operation_id: Annotated[str, StringConstraints(strip_whitespace=True, strict=True)] = Field(
        min_length=1,
        description="Идентификатор операции в активном датасете",
    )


class ShapFeature(BaseModel):
    name: str
    raw_value: float | None = Field(allow_inf_nan=False)
    transformed_value: float = Field(allow_inf_nan=False)
    contribution: float = Field(allow_inf_nan=False)


class ShapReady(BaseModel):
    status: Literal["ready"]
    explanation_id: str
    method: str
    method_version: str
    output_name: str
    output_scale: str
    base_value: float = Field(allow_inf_nan=False)
    output_value: float = Field(allow_inf_nan=False)
    features: list[ShapFeature]
    top_k: int = Field(gt=0)
    remaining_contribution: float = Field(allow_inf_nan=False)
    template_text: str

    @model_validator(mode="after")
    def validate_feature_count(self) -> "ShapReady":
        if self.top_k != len(self.features):
            raise ValueError("top_k должен совпадать с количеством признаков")
        return self


class ShapNotReady(BaseModel):
    status: Literal["unavailable", "failed"]
    reason: str


ShapResult = Annotated[ShapReady | ShapNotReady, Field(discriminator="status")]


class LlmReady(BaseModel):
    status: Literal["ready"]
    generation_id: str
    explanation_id: str
    model_version: str
    prompt_version: str
    text: Annotated[str, StringConstraints(strip_whitespace=True, strict=True)] = Field(
        min_length=1
    )


class LlmNotReady(BaseModel):
    status: Literal["unavailable", "failed"]
    reason: str


LlmResult = Annotated[LlmReady | LlmNotReady, Field(discriminator="status")]


class CheckViolation(BaseModel):
    feature: str | None = None
    message: Annotated[str, StringConstraints(strip_whitespace=True, strict=True)] = Field(
        min_length=1
    )


class CheckItem(BaseModel):
    code: str
    status: Literal["passed", "rejected"]
    violations: list[CheckViolation]

    @model_validator(mode="after")
    def validate_violations(self) -> "CheckItem":
        if self.status == "passed" and self.violations:
            raise ValueError("У успешной проверки не должно быть нарушений")

        if self.status == "rejected" and not self.violations:
            raise ValueError("У отклонённой проверки должно быть хотя бы одно нарушение")
        return self


class ChecksCompleted(BaseModel):
    status: Literal["passed", "rejected"]
    checker_version: str
    generation_id: str
    explanation_id: str
    items: list[CheckItem] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_items(self) -> "ChecksCompleted":
        if self.checker_version not in REQUIRED_CHECKS:
            raise ValueError("Неизвестная версия набора проверок")

        required = REQUIRED_CHECKS[self.checker_version]
        codes = [item.code for item in self.items]

        if len(codes) != len(set(codes)):
            raise ValueError("Коды проверок не должны повторяться")

        if not set(codes).issubset(required):
            raise ValueError("Неизвестный код проверки для этой версии")

        if self.status == "passed" and set(codes) != required:
            raise ValueError("Для passed требуется полный обязательный набор проверок")

        has_rejected = any(item.status == "rejected" for item in self.items)

        if self.status == "passed" and has_rejected:
            raise ValueError("У успешной проверки не должно быть отклонённых элементов")

        if self.status == "rejected" and not has_rejected:
            raise ValueError("У отклонённой проверки должен быть хотя бы один отклонённый элемент")

        return self


class ChecksNotCompleted(BaseModel):
    status: Literal["not_run", "failed"]
    reason: Annotated[str, StringConstraints(strip_whitespace=True, strict=True)] = Field(
        min_length=1
    )


ChecksResult = Annotated[ChecksCompleted | ChecksNotCompleted, Field(discriminator="status")]


class ExplanationResult(BaseModel):
    shap: ShapResult
    llm: LlmResult
    checks: ChecksResult

    @model_validator(mode="after")
    def validate_dependencies(self) -> "ExplanationResult":
        if self.checks.status in ("passed", "rejected") and self.llm.status != "ready":
            raise ValueError("Завершённые проверки требуют готового текста LLM")

        if self.llm.status == "ready" and self.shap.status != "ready":
            raise ValueError("Готовый текст LLM требует готового SHAP-объяснения")
        if self.llm.status == "ready":
            if self.llm.explanation_id != self.shap.explanation_id:
                raise ValueError("explanation_id LLM не совпадает с explanation_id SHAP")
            if self.checks.status in ("passed", "rejected"):
                if self.checks.generation_id != self.llm.generation_id:
                    raise ValueError("generation_id Checks не совпадает с generation_id LLM")
                if self.checks.explanation_id != self.llm.explanation_id:
                    raise ValueError("explanation_id Checks не совпадает с explanation_id LLM")
        return self


class OperationSummary(BaseModel):
    operation_id: Annotated[str, StringConstraints(strip_whitespace=True, strict=True)] = Field(
        min_length=1
    )
    event_time: str
    amount: float = Field(ge=0, allow_inf_nan=False)
    customer_id: Annotated[str, StringConstraints(strip_whitespace=True, strict=True)] = Field(
        min_length=1
    )
    terminal_id: Annotated[str, StringConstraints(strip_whitespace=True, strict=True)] = Field(
        min_length=1
    )

    @field_validator("event_time")
    @classmethod
    def validate_event_time(cls, value: str) -> str:
        message = "event_time должен иметь формат YYYY-MM-DDTHH:MM:SS"

        try:
            parsed = datetime.strptime(value, "%Y-%m-%dT%H:%M:%S")
        except ValueError as error:
            raise ValueError(message) from error

        if parsed.isoformat(timespec="seconds") != value:
            raise ValueError(message)

        return value


class OperationsResponse(BaseModel):
    dataset_version: str
    items: list[OperationSummary]


class PredictionResponse(BaseModel):
    operation_id: str
    request_id: str
    dataset_version: str
    score: float = Field(allow_inf_nan=False)
    threshold: float = Field(allow_inf_nan=False)
    model_version: str
    feature_schema_version: str
    explanation: ExplanationResult
    prediction_id: str


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
