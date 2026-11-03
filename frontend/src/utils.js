export const number = new Intl.NumberFormat('ru-RU');
export const money = value => number.format(value) + ' ₽';
export function filterTransactions(items, tabStatus, status, query) {
  const search = query.trim().toLocaleLowerCase('ru-RU').replace(/^№\s*/, '');
  return items.filter(item => (!tabStatus || item.status === tabStatus)
    && (!status || item.status === status)
    && (!search || item.id.includes(search) || item.orderId.includes(search)));
}
export function toCsv(items) {
  const cell = value => '"' + String(value).replaceAll('"', '""') + '"';
  return '\uFEFF' + [['Номер операции', 'Заказ', 'Сумма, ₽', 'Статус'], ...items.map(item => [item.id, item.orderId, item.amount, item.status])]
    .map(row => row.map(cell).join(';')).join('\r\n');
}

