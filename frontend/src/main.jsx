import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import tabs from './tab.json';
import { statuses, transactions } from './data.js';
import { filterTransactions, money, number, toCsv } from './utils.js';
import './style.css';
import { mockScenarios } from './mockScenarios.js';
import OperationCheck from './OperationCheck.jsx';

function StatusBadge({ status }) {
  return <span className={'badge ' + status}><span className="dot" aria-hidden="true"/>{statuses[status].title}</span>;
}
function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>;
}
function ProductIllustration() {
  return <svg className="product-image" viewBox="0 0 126 126" role="img" aria-label="Иллюстрация аэрогриля"><defs><linearGradient id="product" x2="1" y2="1"><stop stopColor="#E8F3FF"/><stop offset="1" stopColor="#FCEAF3"/></linearGradient></defs><rect width="126" height="126" rx="12" fill="url(#product)"/><ellipse cx="63" cy="113" rx="39" ry="5" fill="#182640" opacity=".08"/><rect x="30" y="18" width="66" height="87" rx="18" fill="#283247"/><rect x="37" y="23" width="52" height="20" rx="10" fill="#172033"/><rect x="37" y="49" width="52" height="45" rx="10" fill="#414C61"/><rect x="43" y="54" width="40" height="31" rx="8" fill="#151D2D"/><rect x="51" y="55" width="24" height="4" rx="2" fill="#7A879A"/><rect x="55" y="89" width="17" height="3" rx="1" fill="#A5ADBE"/></svg>;
}
function Header() {
  return <header className="header"><span className="logo" aria-label="Ozon">OZON</span><div className="header-title"><span>ФИНАНСОВЫЙ КОНТРОЛЬ</span><strong>Данные транзакций</strong></div><div className="account"><span className="environment">Рабочая среда</span><span className="avatar account-avatar" aria-label="Профиль АК">АК</span></div></header>;
}
function Sidebar({ activeId, onChange }) {
  const refs = useRef([]);
  function onKeyDown(event, index) {
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); onChange(tabs[next].id); refs.current[next]?.focus(); }
  }
  return <aside className="sidebar"><p className="eyebrow">ДАННЫЕ</p><div role="tablist" aria-label="Категории операций" aria-orientation="vertical" className="tabs">{tabs.map((tab, index) => <button key={tab.id} ref={node => { refs.current[index] = node; }} id={'tab-' + tab.id} role="tab" aria-selected={tab.id === activeId} aria-controls={'panel-' + tab.id} tabIndex={tab.id === activeId ? 0 : -1} className={'nav-tab ' + (tab.id === activeId ? 'active' : '')} onClick={() => onChange(tab.id)} onKeyDown={event => onKeyDown(event, index)}>{tab.status ? <span className={'nav-dot ' + tab.status} aria-hidden="true"/> : <span className="list-icon" aria-hidden="true">☰</span>}<span>{tab.title}</span><span className="count">{transactions.filter(item => !tab.status || item.status === tab.status).length}</span></button>)}</div><footer className="system"><div>Система работает <span className="system-dot"/></div><small>Обработка в реальном времени</small></footer></aside>;
}
function TransactionsPanel({ tab, selectedId, onSelect }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const items = filterTransactions(transactions, tab.status, status, query);
  function exportCsv() {
    const url = URL.createObjectURL(new Blob([toCsv(items)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'ozon-transactions.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section role="tabpanel" id={'panel-' + tab.id} aria-labelledby={'tab-' + tab.id} tabIndex={0} className="operations">
    <h1>Операции</h1><p className="subtitle">История и результаты проверки транзакций</p>
    <p className="demo-notice">
  Демо-режим: показаны mock-данные. Реальная модель не подключена.
    </p>
    <dl className="stats"><div><dt>Всего операций</dt><dd>{transactions.length}</dd></div><div><dt>Approved</dt><dd className="approved-text">{transactions.filter(t => t.status === 'approved').length}</dd></div><div><dt>Banned</dt><dd className="banned-text">{transactions.filter(t => t.status === 'banned').length}</dd></div></dl>
    <div className="toolbar"><label className="search"><SearchIcon/><span className="sr-only">Поиск по номеру операции или заказа</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по номеру операции или заказа"/></label><label className="status-select"><span className="sr-only">Статус операции</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="">Все статусы</option>{Object.entries(statuses).map(([id, item]) => <option key={id} value={id}>{item.title}</option>)}</select></label><button className="export-button" onClick={exportCsv}><span aria-hidden="true">↓</span> Экспорт CSV</button></div>
    <div className="table-card"><div className="table-scroll"><table><caption className="sr-only">{tab.title}: транзакции</caption><thead><tr><th scope="col">Номер операции</th><th scope="col">Заказ</th><th scope="col">Сумма</th><th scope="col">Статус</th><th scope="col"><span className="sr-only">Действие</span></th></tr></thead><tbody>{items.map(item => <tr key={item.id} onClick={() => onSelect(item.id)} className={item.id === selectedId ? 'selected' : ''}><td><button className="operation-button" onClick={() => onSelect(item.id)} aria-label={'Открыть операцию № ' + item.id} aria-pressed={item.id === selectedId}>№ {item.id}</button></td><td className="muted">{item.orderId}</td><td className="amount">{money(item.amount)}</td><td><StatusBadge status={item.status}/></td><td><button className="row-arrow" onClick={() => onSelect(item.id)} aria-label={'Детали операции № ' + item.id}>›</button></td></tr>)}</tbody></table></div>{!items.length && <p className="empty" role="status">Операции не найдены. Измените поиск или фильтр.</p>}<div className="table-footer" aria-live="polite"><span>Показано {items.length} из {transactions.filter(item => !tab.status || item.status === tab.status).length} операций</span><span>{items.length ? '1 / 1' : '0 / 0'}</span></div></div>
    <div className="updated"><span>Обновлено только что</span><span className="system-dot" aria-hidden="true"/></div>
  </section>;
}

function AnalysisResult({ result = null }) {
  const score = result?.score;
  const hasScore = typeof score === 'number' && Number.isFinite(score);

  const hasShap =
    result?.shap != null &&
    (!Array.isArray(result.shap) || result.shap.length > 0);

  const explanation = result?.explanation;
  const hasExplanation =
    typeof explanation === 'string' && explanation.trim().length > 0;

  const checks = result?.checks;

  const checkLabels = {
    notRun: 'Проверки не выполнялись',
    rejected: 'Ответ не прошёл проверку',
  };

  return (
    <section className="analysis-result" aria-label="Результат проверки">
      <h3>Результат проверки</h3>

      <p className="analysis-note">
        {result?.isMock
          ? 'Mock-данные. Реальная модель и проверки не подключены.'
          : 'Подключение реальных артефактов не подтверждено.'}
      </p>

      <section className="analysis-block">
        <h4>Score модели</h4>

        <p>{hasScore ? String(score) : 'Не предоставлено'}</p>

        <small>
          Score не обозначается вероятностью без определения шкалы
          в контракте.
        </small>
      </section>

      <section className="analysis-block">
        <h4>SHAP — вклады признаков</h4>

        {hasShap ? (
          <pre>{JSON.stringify(result.shap, null, 2)}</pre>
        ) : (
          <p>SHAP-объяснение отсутствует</p>
        )}
      </section>

      <section className="analysis-block">
        <h4>LLM — текстовое объяснение</h4>

        <p>
          {hasExplanation
            ? explanation
            : 'Текстовое объяснение отсутствует'}
        </p>

        {result?.isMock && (
          <small>
            Демонстрационный текст, не ответ реальной LLM.
          </small>
        )}
      </section>

      <section className="analysis-block">
        <h4>Checks — проверка ответа</h4>

        <p>
          {checks
            ? checkLabels[checks.status] ?? 'Статус проверки не распознан'
            : 'Результат проверок не предоставлен'}
        </p>

        {checks?.reason && (
          <p className="check-reason">{checks.reason}</p>
        )}

        {checks?.status === 'rejected' && (
          <small>
            Отказ проверки ответа не означает блокировку операции
            или обвинение покупателя.
          </small>
        )}
      </section>
    </section>
  );
}

function Details({
  transaction: item,
  scenarioId = 'ready',
  onClose,
  onOpenOrder,
}) {
  const status = statuses[item.status];
  return <aside className="details" aria-label={'Карточка операции № ' + item.id}><div className="detail-top"><p className="eyebrow">КАРТОЧКА ОПЕРАЦИИ</p><button className="close" onClick={onClose} aria-label="Закрыть карточку операции">×</button></div><div className="detail-heading"><h2>№ {item.id}</h2><StatusBadge status={item.status}/></div><div className="detail-amount"><p>Сумма операции</p><strong>{number.format(item.amount)} <span>₽</span></strong></div><div className={'decision ' + item.status}><span aria-hidden="true">{status.icon}</span>{status.message}</div>
    <div className="order-label">Заказ</div><button className="order-link" onClick={() => onOpenOrder(item)}>№ {item.orderId}<span aria-hidden="true">↗</span></button>
    {item.product && <article className="product-card"><ProductIllustration/><div><p className="product-category">{item.product.category}</p><h3>{item.product.title}</h3><p className="product-caption">Товар в заказе № {item.orderId}</p><button className="text-link" onClick={() => onOpenOrder(item, 'product')}>Открыть карточку товара <span aria-hidden="true">↗</span></button></div></article>}
    <div className="customer"><p className="eyebrow">ПОЛЬЗОВАТЕЛЬ</p>{item.customer ? <div className="customer-row"><span className="avatar">{item.initials}</span><div><strong>{item.customer}</strong><small>Покупатель</small></div></div> : <p className="missing">Данные пользователя не указаны</p>}</div>
    <dl className="processing"><dt>Время обработки</dt><dd>{item.processingTime || 'Не указано'}</dd></dl>
    <OperationCheck
  operationId={item.id}
  scenarioId={scenarioId}
  />
    <button className="primary" onClick={() => onOpenOrder(item)}>Подробнее о заказе <span aria-hidden="true">↗</span></button>
  </aside>;
}
function OrderDialog({ value, onClose }) {
  const dialogRef = useRef(null);
  React.useEffect(() => { dialogRef.current.showModal(); }, []);
  const item = value.transaction;
  return <dialog ref={dialogRef} className="order-dialog" aria-labelledby="dialog-title" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><button className="close" onClick={onClose} aria-label="Закрыть окно">×</button><h2 id="dialog-title">{value.kind === 'product' ? item.product.title : 'Заказ № ' + item.orderId}</h2><p>Операция № {item.id} · {money(item.amount)}</p>{item.customer && <p>{item.customer}</p>}<p className="muted">Демонстрационные данные из макета. Для перехода во внешнюю систему подключите URL заказа или API.</p><button className="primary" onClick={onClose}>Закрыть</button></dialog>;
}
const componentRegistry = { TransactionsPanel };
function App() {
  const [activeId, setActiveId] = useState(tabs[0].id);
  const [selectedId, setSelectedId] = useState(null);
  const [order, setOrder] = useState(null);
  const [scenarioId, setScenarioId] = useState('ready');

  const activeTab = tabs.find(tab => tab.id === activeId);
  const Panel = componentRegistry[activeTab.content];

  const isEmpty = scenarioId === 'empty';

  const selected = isEmpty
    ? null
    : transactions.find(item => item.id === selectedId);

  function changeTab(id) {
    setActiveId(id);
    setSelectedId(null);
  }

  function changeScenario(event) {
    setScenarioId(event.target.value);
    setSelectedId(null);
  }

  function openOrder(transaction, kind = 'order') {
    setOrder({ transaction, kind });
  }

  return (
    <>
      <Header />
      <Sidebar activeId={activeId} onChange={changeTab} />

      <div style={{ padding: '16px 24px' }}>
        <label>
          Демо: сценарий проверки{' '}
          <select value={scenarioId} onChange={changeScenario}>
            {mockScenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <main
        className={
          'workspace ' + (!selected ? 'no-details' : '')
        }
      >
        {isEmpty ? (
          <section className="operations">
            <h1>Операции</h1>
            <p className="demo-notice">
              Демо-режим: очередь искусственно очищена.
            </p>
            <p role="status">В очереди нет операций</p>
          </section>
        ) : Panel ? (
          <Panel
            key={activeTab.id}
            tab={activeTab}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <p role="alert">Компонент вкладки не найден.</p>
        )}

        {selected && (
          <Details
            transaction={selected}
            scenarioId={scenarioId}
            onClose={() => setSelectedId(null)}
            onOpenOrder={openOrder}
          />
        )}
      </main>

      {order && (
        <OrderDialog
          value={order}
          onClose={() => setOrder(null)}
        />
      )}
    </>
  );
}
 
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);