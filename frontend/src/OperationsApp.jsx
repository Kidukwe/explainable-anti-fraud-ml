import React, { useRef, useState } from 'react';
import tabs from './tab.json';
import { filterTransactions, number, toCsv } from './utils.js';
import brandLogo from './assets/ozon-antifraud.svg';

function countRows(rows) {
  return rows?.length ?? '—';
}

function displayAmount(amount) {
  if (!Number.isFinite(amount)) return 'Нет данных';
  return number.format(amount);
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

function Header({ isDemo }) {
  return (
    <header className="header">
      <img
        className="brand-vector"
        src={brandLogo}
        alt="OZON anti fraud"
        width={122}
        height={45}
      />

      <div className="header-title">
        <span>ФИНАНСОВЫЙ КОНТРОЛЬ</span>
        <strong>Данные транзакций</strong>
      </div>

      <div className="account">
        <span className="environment production-environment">
          {isDemo ? 'Демонстрационный стенд' : 'Рабочий режим'}
        </span>
        <span className="avatar account-avatar" aria-label="Профиль АК">
          АК
        </span>
      </div>
    </header>
  );
}

function Sidebar({ activeId, onChange, rows, isDemo}) {
  const refs = useRef([]);

  function onKeyDown(event, index) {
    const available = tabs.map((tab, position) => ({ tab, position }))
    const current = available.findIndex(({ position }) => position === index);
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    let next;
    if (step) next = available[(current + step + available.length) % available.length];
    if (event.key === 'Home') next = available[0];
    if (event.key === 'End') next = available.at(-1);
    if (next) {
      event.preventDefault();
      onChange(next.tab.id);
      refs.current[next.position]?.focus();
    }
  }

  return (
    <aside className="sidebar">
      <p className="eyebrow">ДАННЫЕ</p>
      <div role="tablist" aria-label="Категории операций" aria-orientation="vertical" className="tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={node => { refs.current[index] = node; }}
            id={'tab-' + tab.id}
            role="tab"
            aria-selected={tab.id === activeId}
            aria-controls={'panel-' + tab.id}
            tabIndex={tab.id === activeId ? 0 : -1}
            className={'nav-tab ' + (tab.id === activeId ? 'active' : '')}
            onClick={() => onChange(tab.id)}
            onKeyDown={event => onKeyDown(event, index)}
          >
            <span className="list-icon" aria-hidden="true">☰</span>
            <span>{tab.title}</span>
            <span className="count">{countRows(rows)}</span>
          </button>
        ))}
      </div>
      <footer className="system">
        <div>
          {isDemo ? 'Демо-режим' : 'Рабочий режим'} <span className="system-dot" />
        </div>
        {isDemo && <small>Модель и API не подключены</small>}
      </footer>
    </aside>
  );
}

function TransactionsPanel({ tab, selectedId, onSelect, rows, isDemo, notice, datasetVersion }) {
  const [query, setQuery] = useState('');
  const items = filterTransactions(rows ?? [],query);

  function exportCsv() {
    const blob = new Blob([toCsv(items)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mock-transactions.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section
      role="tabpanel"
      id={'panel-' + tab.id}
      aria-labelledby={'tab-' + tab.id}
      tabIndex={0}
      className="operations"
    >
      <h1>Операции</h1>
      <p className="subtitle">История и результаты проверки транзакций</p>
      {datasetVersion && <p className="subtitle">Версия датасета: {datasetVersion}</p>}

      {isDemo && (
        <p className="demo-notice">
          Учебный проект. Демо-режим: показаны mock-данные. Реальная модель не подключена.
        </p>
      )}

      <dl className="stats">
        <div><dt>Получено операций</dt><dd>{countRows(rows)}</dd></div>
      </dl>

      <div className="toolbar">
        <label className="search">
          <SearchIcon />
          <span className="sr-only">Поиск по номеру операции</span>
          <input
            type="search"
            disabled={!rows?.length}
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Поиск по номеру операции"
          />
        </label>

       
        {isDemo && (
          <button className="export-button" disabled={!items.length} onClick={exportCsv}>
            <span aria-hidden="true">↓</span> Экспорт CSV
          </button>
        )}
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              {tab.title}: транзакции
            </caption>
            <thead>
              <tr>
                <th scope="col">Номер операции</th>
                <th scope="col">Время операции</th>
                <th scope="col">Сумма</th>
                <th scope="col">ID клиента</th>
                <th scope="col">ID терминала</th>
                <th scope="col"><span className="sr-only">Действие</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr
                  key={item.operation_id}
                  onClick={() => onSelect(item.operation_id)}
                  className={item.operation_id === selectedId ? 'selected' : ''}
                >
                  <td>
                    <button
                      className="operation-button"
                      onClick={() => onSelect(item.operation_id)}
                      aria-label={'Открыть операцию № ' + item.operation_id}
                      aria-pressed={item.operation_id === selectedId}
                    >
                      № {item.operation_id}
                    </button>
                  </td>
                  <td className="muted">{item.event_time ?? '—'}</td>
                  <td className="amount">{displayAmount(item.amount)}</td>
                  <td>{item.customer_id ?? '—'}</td>
                  <td>{item.terminal_id ?? '—'}</td>
                  <td>
                    <button
                      className="row-arrow"
                      onClick={() => onSelect(item.operation_id)}
                      aria-label={'Детали операции № ' + item.operation_id}
                    >
                      ›
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {notice || (
          !rows?.length
            ? <p className="empty" role="status">Операций нет</p>
            : !items.length && (
              <p className="empty" role="status">
                Операции не найдены. Измените поиск или фильтр.
              </p>
            )
        )}

        {rows && (
          <div className="table-footer" aria-live="polite">
            <span>Показано операций: {items.length}</span>
          </div>
        )}
      </div>

      {!rows?.length && (
        <p className="action-reason">Поиск и фильтры доступны после загрузки операций.</p>
      )}
      {isDemo && !items.length && (
        <p className="action-reason">Для экспорта нужны операции в таблице.</p>
      )}
    </section>
  );
}

function Details({ item, onClose, children }) {
  return (
    <aside
      className={item ? 'details' : 'details details-placeholder'}
      aria-label={item ? 'Карточка операции № ' + item.operation_id : 'Карточка операции'}
    >
      <div className="detail-top">
        <p className="eyebrow">КАРТОЧКА ОПЕРАЦИИ</p>
        {item && (
          <button className="close" onClick={onClose} aria-label="Закрыть карточку операции">
            ×
          </button>
        )}
      </div>

      {item ? (
        <>
          <div className="detail-heading">
            <h2>№ {item.operation_id}</h2>
          </div>

          <div className="detail-amount">
            <p>Сумма операции</p>
            <strong>{displayAmount(item.amount)}</strong>
          </div>

          <dl className="operation-fields">
            <dt>Время операции</dt><dd>{item.event_time ?? 'Нет данных'}</dd>
            <dt>ID клиента</dt><dd>{item.customer_id ?? 'Нет данных'}</dd>
            <dt>ID терминала</dt><dd>{item.terminal_id ?? 'Нет данных'}</dd>
          </dl>
          {children}
        </>
      ) : <p className="empty">Выберите операцию</p>}
    </aside>
  );
}

const componentRegistry = { TransactionsPanel };

export default function OperationsApp({
  queue, isDemo = false, notice, controls, children,
}) {
  const [activeId, setActiveId] = useState(tabs[0].id);
  const [selectedId, setSelectedId] = useState(null);
  const rows = queue?.items;
  const activeTab = tabs.find(tab => tab.id === activeId);
  const Panel = componentRegistry[activeTab.content];
  const selected = rows?.find(item => item.operation_id === selectedId);

  if (selectedId !== null && !selected) setSelectedId(null);

  function changeTab(id) {
    setActiveId(id);
    setSelectedId(null);
  }

  return (
    <>
      <Header isDemo={isDemo} />
      <Sidebar activeId={activeId} onChange={changeTab} rows={rows} isDemo={isDemo} />
      {controls}
      <main className="workspace">
        <Panel
          key={activeTab.id}
          tab={activeTab}
          rows={rows}
          isDemo={isDemo}
          notice={notice}
          datasetVersion={queue?.dataset_version}
          selectedId={selected?.operation_id}
          onSelect={setSelectedId}
        />
        <Details
          item={selected}
          onClose={() => setSelectedId(null)}
        >
          {selected && children(selected)}
        </Details>
      </main>
    </>
  );
}
