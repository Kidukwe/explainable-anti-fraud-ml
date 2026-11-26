import json
import re
from pathlib import Path

import pytest
from pydantic import ValidationError

from backend.schemas import (
    ChecksCompleted,
    ExplanationResult,
    OperationsResponse,
    OperationSummary,
    PredictionRequest,
    PredictionResponse,
    ShapFeature,
    ShapReady,
)


def test_prediction_request_rejects_extra_fields():
    with pytest.raises(ValidationError) as exc_info:
        PredictionRequest(operation_id="456", amount=100)
    errors = exc_info.value.errors()
    assert errors[0]["type"] == "extra_forbidden"
    assert errors[0]["loc"] == ("amount",)


def test_shap_rejects_wrong_feature_count():
    with pytest.raises(ValidationError, match="top_k должен совпадать"):
        ShapReady(
            status="ready",
            explanation_id="exp-test-001",
            method="TreeSHAP",
            method_version="test-v1",
            output_name="positive_class",
            output_scale="raw_margin",
            base_value=-2.0,
            output_value=-1.3,
            features=[
                {
                    "name": "TX_AMOUNT",
                    "raw_value": 200.0,
                    "transformed_value": 200.0,
                    "contribution": 0.5,
                }
            ],
            top_k=2,
            remaining_contribution=0.2,
            template_text="Условное объяснение для теста",
        )


@pytest.fixture
def valid_shap() -> ShapReady:
    return ShapReady(
        status="ready",
        explanation_id="exp-test-001",
        method="TreeSHAP",
        method_version="test-v1",
        output_name="positive_class",
        output_scale="raw_margin",
        base_value=-2.0,
        output_value=-1.3,
        features=[
            {
                "name": "TX_AMOUNT",
                "raw_value": 200.0,
                "transformed_value": 200.0,
                "contribution": 0.5,
            }
        ],
        top_k=1,
        remaining_contribution=0.2,
        template_text="Условное объяснение для теста",
    )


def test_shap_accept_matching_feature_count(valid_shap):
    assert valid_shap.top_k == len(valid_shap.features) == 1


def test_explanation_rejects_mismatched_shap_id(valid_shap):
    with pytest.raises(
        ValidationError,
        match="explanation_id LLM не совпадает",
    ):
        ExplanationResult(
            shap=valid_shap,
            llm={
                "status": "ready",
                "generation_id": "gen-test-001",
                "explanation_id": "exp-other",
                "model_version": "test-llm-v1",
                "prompt_version": "test-prompt-v1",
                "text": "Условный текст для теста",
            },
            checks={
                "status": "not_run",
                "reason": "test_scenario",
            },
        )


def test_explanation_rejects_mismatched_generation_id(valid_shap):
    with pytest.raises(
        ValidationError,
        match="generation_id Checks не совпадает",
    ):
        ExplanationResult(
            shap=valid_shap,
            llm={
                "status": "ready",
                "generation_id": "gen-test-001",
                "explanation_id": "exp-test-001",
                "model_version": "test-llm-v1",
                "prompt_version": "test-prompt-v1",
                "text": "Условный текст для теста",
            },
            checks={
                "status": "passed",
                "checker_version": "v1",
                "generation_id": "gen-other",
                "explanation_id": "exp-test-001",
                "items": [
                    {"code": "top_k_coverage", "status": "passed", "violations": []},
                    {"code": "contribution_direction", "status": "passed", "violations": []},
                    {"code": "numeric_consistency", "status": "passed", "violations": []},
                    {"code": "no_new_factors", "status": "passed", "violations": []},
                ],
            },
        )


def test_explanation_accepts_matching_ids(valid_shap):
    result = ExplanationResult(
        shap=valid_shap,
        llm={
            "status": "ready",
            "generation_id": "gen-test-001",
            "explanation_id": "exp-test-001",
            "model_version": "test-llm-v1",
            "prompt_version": "test-prompt-v1",
            "text": "Условный текст для теста",
        },
        checks={
            "status": "passed",
            "checker_version": "v1",
            "generation_id": "gen-test-001",
            "explanation_id": "exp-test-001",
            "items": [
                {"code": "top_k_coverage", "status": "passed", "violations": []},
                {"code": "contribution_direction", "status": "passed", "violations": []},
                {"code": "numeric_consistency", "status": "passed", "violations": []},
                {"code": "no_new_factors", "status": "passed", "violations": []},
            ],
        },
    )
    assert result.llm.explanation_id == result.shap.explanation_id
    assert result.checks.generation_id == result.llm.generation_id
    assert result.checks.explanation_id == result.llm.explanation_id


def test_explanation_accepts_unavailable_llm(valid_shap):
    result = ExplanationResult(
        shap=valid_shap,
        llm={
            "status": "unavailable",
            "reason": "llm_not_configured",
        },
        checks={
            "status": "not_run",
            "reason": "llm_text_unavailable",
        },
    )
    assert result.shap.status == "ready"
    assert result.llm.status == "unavailable"
    assert result.checks.status == "not_run"


def test_prediction_response_accepts_unavailable_explanation():
    result = PredictionResponse(
        request_id="req-example-001",
        operation_id="456",
        prediction_id="pred-example-001",
        score=0.82,
        threshold=0.70,
        model_version="baseline-v1",
        feature_schema_version="features-v1",
        dataset_version="demo-v1",
        explanation={
            "shap": {
                "status": "unavailable",
                "reason": "xai_not_implemented",
            },
            "llm": {
                "status": "unavailable",
                "reason": "shap_unavailable",
            },
            "checks": {
                "status": "not_run",
                "reason": "llm_text_unavailable",
            },
        },
    )

    assert result.explanation.shap.status == "unavailable"
    assert result.explanation.llm.status == "unavailable"
    assert result.explanation.checks.status == "not_run"


@pytest.mark.parametrize("operation_id", ["", "   ", 456, None])
def test_prediction_request_rejects_invalid_id(operation_id):
    with pytest.raises(ValidationError):
        PredictionRequest(operation_id=operation_id)


def test_prediction_request_requires_operation_id():
    with pytest.raises(ValidationError):
        PredictionRequest()


@pytest.mark.parametrize(
    "event_time",
    [
        "2018-04-01T10:00:00",
        "2018-02-30T10:00:00",
        "2018-04-01T10:00:00Z",
        "привет",
    ],
)
def test_operation_event_time(event_time):
    data = {
        "operation_id": "456",
        "event_time": event_time,
        "amount": 200.0,
        "customer_id": "596",
        "terminal_id": "3156",
    }

    if event_time == "2018-04-01T10:00:00":
        result = OperationSummary(**data)
        assert result.event_time == event_time
    else:
        with pytest.raises(ValidationError, match="event_time"):
            OperationSummary(**data)


def test_operations_response_accepts_empty_list():
    result = OperationsResponse(dataset_version="demo-v1", items=[])
    assert result.items == []


def test_checks_reject_incomplete_passed_set():
    with pytest.raises(
        ValidationError,
        match="полный обязательный набор",
    ):
        ChecksCompleted(
            status="passed",
            checker_version="v1",
            generation_id="gen-test-001",
            explanation_id="exp-test-001",
            items=[
                {
                    "code": "contribution_direction",
                    "status": "passed",
                    "violations": [],
                }
            ],
        )


def test_shap_feature_preserves_missing_raw_value():
    feature = ShapFeature(
        name="TX_AMOUNT",
        raw_value=None,
        transformed_value=100.0,
        contribution=0.5,
    )

    payload = feature.model_dump()

    assert payload["raw_value"] is None
    assert payload["transformed_value"] == 100.0


def test_contract_json_examples_are_valid():
    path = Path(__file__).resolve().parents[1] / "docs" / "contracts.md"
    document = path.read_text(encoding="utf-8")
    blocks = re.findall(r"```json\s*\n(.*?)\n```", document, re.DOTALL)

    assert blocks, "В контракте не найдены JSON-примеры"

    for number, block in enumerate(blocks, start=1):
        try:
            json.loads(block)
        except json.JSONDecodeError as error:
            pytest.fail(f"JSON-пример №{number} некорректен: {error}")
