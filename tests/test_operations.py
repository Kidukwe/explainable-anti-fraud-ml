"""The foundation must distinguish process health from model readiness."""

from fastapi.testclient import TestClient

from backend.app import app

client = TestClient(app)


def test_liveness_is_independent_of_model() -> None:
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "antifraud"}


def test_readiness_does_not_claim_missing_model_is_ready() -> None:
    response = client.get("/readyz")
    assert response.status_code == 503
    assert response.json()["reason"] == "model_not_implemented"


def test_metrics_are_absent_instead_of_fabricated() -> None:
    response = client.get("/api/v1/metrics")
    assert response.status_code == 503
    assert response.json()["metrics"] is None
    assert response.json()["reason"] == "evaluation_not_run"


def test_dashboard_assets_and_api_docs_are_routed_separately() -> None:
    assert "Ozon Anti-Fraud" in client.get("/").text
    for path, content_type in [("/style.css", "text/css"), ("/app.js", "javascript")]:
        response = client.get(path)
        assert response.status_code == 200
        assert content_type in response.headers["content-type"]
    assert client.get("/docs").status_code == 200
    assert "/healthz" in client.get("/openapi.json").json()["paths"]


def test_unimplemented_prediction_is_not_a_fake_success() -> None:
    assert client.post("/api/v1/predict", json={}).status_code == 405
