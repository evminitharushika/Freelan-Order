import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerModal } from '../components/order/CustomerModal';
import { draftService } from '../services/draftService';
import type { Customer } from '../lib/types';

interface OrderStartValue {
  /** Opens the "who's ordering?" step. `path` defaults to /order (may include ?category=). */
  startOrder(path?: string): void;
  customer: Customer | null;
  setCustomer(c: Customer): void;
}

const Ctx = createContext<OrderStartValue | null>(null);

export function OrderStartProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [customer, setCustomerState] = useState<Customer | null>(() => draftService.getCustomer());
  const [target, setTarget] = useState<string | null>(null);

  const setCustomer = useCallback((c: Customer) => {
    draftService.setCustomer(c);
    setCustomerState(c);
  }, []);

  const startOrder = useCallback((path = '/order') => setTarget(path), []);

  const value = useMemo(() => ({ startOrder, customer, setCustomer }), [startOrder, customer, setCustomer]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <CustomerModal
        open={target !== null}
        initial={customer}
        onClose={() => setTarget(null)}
        onSubmit={(c) => {
          setCustomer(c);
          const to = target ?? '/order';
          setTarget(null);
          navigate(to);
        }}
      />
    </Ctx.Provider>
  );
}

export function useOrderStart(): OrderStartValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOrderStart must be used inside <OrderStartProvider>');
  return ctx;
}
