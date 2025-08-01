import React from 'react';
import { TenantProvider } from './src/contexts/TenantContext';
import Router from './src/Router';

export default function App() {
  return (
    <TenantProvider>
      <Router />
    </TenantProvider>
  );
}
