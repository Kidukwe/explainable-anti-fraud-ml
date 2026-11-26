"""Check the running bootstrap API, including the explicit absence of a model."""

import argparse
import json
from urllib.error import HTTPError
from urllib.request import urlopen


def check(base_url: str) -> None:
    expectations = {
        "/healthz": (200, {"status": "ok", "service": "antifraud"}),
        "/readyz": (503, {"status": "not_ready", "reason": "model_not_implemented"}),
        "/api/v1/metrics": (
            503,
            {"status": "not_available", "metrics": None, "reason": "evaluation_not_run"},
        ),
    }
    for path, (expected_status, expected_body) in expectations.items():
        try:
            response = urlopen(f"{base_url}{path}", timeout=10)
        except HTTPError as error:
            response = error
        with response:
            status = response.status
            body = json.load(response)
        print(f"GET {path}: HTTP {status} {json.dumps(body, sort_keys=True)}", flush=True)
        if status != expected_status or body != expected_body:
            raise RuntimeError(f"Unexpected bootstrap response for {path}")

    for path, marker in [("/", "Ozon Anti-Fraud"), ("/docs", "swagger-ui")]:
        with urlopen(f"{base_url}{path}", timeout=10) as response:
            if response.status != 200 or marker not in response.read().decode():
                raise RuntimeError(f"Missing page content for {path}")
        print(f"GET {path}: HTTP 200, expected page content present", flush=True)
    print("PASS: API is alive; model and evaluation are explicitly absent.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    check(args.base_url.rstrip("/"))
