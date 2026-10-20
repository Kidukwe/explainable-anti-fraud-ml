"use strict";
async function refresh() {
  const button = document.getElementById("refresh");
  button.disabled = true;
  try {
    const response = await fetch("/healthz", { cache: "no-store" });
    document.getElementById("api-status").textContent = response.ok ? "Работает" : "Ошибка API";
  } catch {
    document.getElementById("api-status").textContent = "Нет соединения";
  }
  try {
    const response = await fetch("/readyz", { cache: "no-store" });
    const result = await response.json();
    document.getElementById("model-status").textContent = result.reason === "model_not_implemented"
      ? "Ещё не реализована" : response.ok ? "Готова" : "Не готова";
  } catch {
    document.getElementById("model-status").textContent = "Не удалось проверить";
  }
  try {
    const response = await fetch("/api/v1/metrics", { cache: "no-store" });
    const result = await response.json();
    document.getElementById("metrics-status").textContent = result.reason === "evaluation_not_run"
      ? "Оценка ещё не выполнена. Метрики отсутствуют."
      : response.ok ? "Новый формат метрик требует интеграции dashboard."
      : "Не удалось получить метрики.";
  } catch {
    document.getElementById("metrics-status").textContent = "Нет соединения с API метрик.";
  }
  button.disabled = false;
}
document.getElementById("refresh").addEventListener("click", refresh);
refresh();
