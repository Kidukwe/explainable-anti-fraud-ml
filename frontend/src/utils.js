export const number = new Intl.NumberFormat('ru-RU');

export function filterTransactions(items, query) {
  const search = query.trim().toLowerCase().replace(/^№\s*/, '');
  return items.filter(item =>
    item.operation_id.toLowerCase().includes(search),
  );
}

export function toCsv(items) {
  const escape = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  const rows = [
    ['Номер операции', 'Время операции', 'Сумма', 'ID клиента', 'ID терминала'],
    ...items.map(item => [item.operation_id, item.event_time, item.amount, item.customer_id, item.terminal_id]),
  ];
  return '\uFEFF' + rows.map(row => row.map(escape).join(';')).join('\r\n');
}
