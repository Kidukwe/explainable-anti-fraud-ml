export const statusLabels = Object.freeze({
  approved: 'Одобрено',
  banned: 'Заблокировано',
  consideration: 'На рассмотрении',
});

export function statusLabel(code) {
  return Object.hasOwn(statusLabels, code)
    ? statusLabels[code]
    : 'Статус неизвестен';
}