//пока чисто рандом данные, потом будет связь с API
export const statuses = {
  approved: { title: 'Approved', message: 'Автоматически одобрено', icon: '✓', result: 'Операция прошла проверку и не требует дополнительного рассмотрения.' },
  banned: { title: 'Banned', message: 'Автоматически заблокировано', icon: '×' },
  consideration: { title: 'Consideration', message: 'На рассмотрении', icon: '…' }
};

export const transactions = [
  { id: '10001', orderId: '1431', amount: 24990, status: 'approved', processingTime: '0,25 сек', customer: 'Иванов Иван Иванович', initials: 'ПП', product: { title: 'Аэрогриль', category: 'ТЕХНИКА ДЛЯ КУХНИ' } },
  { id: '10000', orderId: '1918', amount: 900, status: 'banned', processingTime:'1,3 сек', customer: 'Петров Петр Петрович', initials: 'ИИ', product: { title: 'Корм для кота', category: 'ЖИВОТНЫЕ' }  },
  { id: '9999', orderId: '3621', amount: 100585, status: 'consideration', processingTime:'1,3 сек', customer: 'Сергеев Александр Сильвесторович', initials: 'СА', product: { title: 'Iphone 18 pro 256 гб', category: 'ТЕХНИКА' } }
];
