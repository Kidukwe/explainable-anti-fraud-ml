// Только демонстрационные значения. API и реальная модель не подключены.
export const statuses = {
  approved: { title: 'Approved', message: 'Approved', icon: '✓', result: 'Операция прошла проверку и не требует дополнительного рассмотрения.' },
  banned: { title: 'Banned', message: 'Banned', icon: '×' },
  consideration: { title: 'Consideration', message: 'Consideration', icon: '…' }
};

export const transactions = [
  { id: '10001', orderId: '1431', amount: 24990, status: 'approved', customer: 'Иванов Иван Иванович', initials: 'ИИ', product: { title: 'Аэрогриль', category: 'ТЕХНИКА ДЛЯ КУХНИ' } },
  { id: '10000', orderId: '1918', amount: 900, status: 'banned', customer: 'Петров Петр Петрович', initials: 'ПП', product: { title: 'Корм для кота', category: 'ЖИВОТНЫЕ' }  },
  { id: '9999', orderId: '3621', amount: 100585, status: 'consideration', customer: 'Сергеев Александр Сильвесторович', initials: 'СА', product: { title: 'Iphone 18 pro 256 гб', category: 'ТЕХНИКА' } }
];
