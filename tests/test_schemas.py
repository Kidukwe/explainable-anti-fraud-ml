import pytest
from pydantic import ValidationError

from backend.schemas import PredictionRequest


def test_prediction_request_rejects_extra_fields():
    with pytest.raises(ValidationError) as exc_info:
        PredictionRequest(operation_id="456", amount=100)
    errors = exc_info.value.errors()
    assert errors[0]["type"] == "extra_forbidden"
    assert errors[0]["loc"] == ("amount",)
