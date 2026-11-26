import React, { useState } from 'react';
import { demoQueue } from './data.js';
import { mockScenarios } from './mockScenarios.js';
import OperationCheck from './OperationCheck.jsx';
import OperationsApp from './OperationsApp.jsx';

export default function DemoApp() {
  const [scenarioId, setScenarioId] = useState('ready');
  const isEmpty = scenarioId === 'empty';

  const controls = (
    <div className="scenario-toolbar">
      <label>
        Демо: сценарий проверки{' '}
        <select
          value={scenarioId}
          onChange={event => {
            setScenarioId(event.target.value);
          }}
        >
          {mockScenarios.map(({ id, title }) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <>
      <OperationsApp
        isDemo
        queue={isEmpty ? { ...demoQueue, items: [] } : demoQueue}
        controls={controls}
      >
        {item => <OperationCheck operationId={item.operation_id} scenarioId={scenarioId} />}
      </OperationsApp>
    </>
  );
}