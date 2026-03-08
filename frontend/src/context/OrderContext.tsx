import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Order, OrderEntity } from '../types/order';
import { MOCK_ORDERS } from '../data/mockOrders';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface OrderState {
  selectedTier: 'investigation' | 'due_diligence' | null;
  entity: OrderEntity;
  jurisdictions: string[];
  priorityAreas: string[];
  languages: string[];
  specialInstructions: string;
  orderId: string | null;
  orderedAt: string | null;
  estimatedDelivery: string | null;
}

const INITIAL_STATE: OrderState = {
  selectedTier: null,
  entity: { name: '', type: 'person', aliases: [] },
  jurisdictions: [],
  priorityAreas: [],
  languages: [],
  specialInstructions: '',
  orderId: null,
  orderedAt: null,
  estimatedDelivery: null,
};

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

interface OrderContextValue {
  state: OrderState;
  orders: Order[];
  setTier: (tier: 'investigation' | 'due_diligence') => void;
  setEntity: (entity: Partial<OrderEntity>) => void;
  setJurisdictions: (j: string[]) => void;
  setPriorityAreas: (p: string[]) => void;
  setLanguages: (l: string[]) => void;
  setSpecialInstructions: (s: string) => void;
  confirmOrder: () => string;
  resetOrder: () => void;
  getOrder: (id: string) => Order | undefined;
  completedCount: number;
}

const OrderContext = createContext<OrderContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrderState>(INITIAL_STATE);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  const setTier = useCallback((tier: 'investigation' | 'due_diligence') => {
    setState((s) => ({
      ...s,
      selectedTier: tier,
      priorityAreas: tier === 'investigation'
        ? ['Traçage UBO', 'Analyse médias défavorables']
        : ['Traçage UBO', 'Analyse médias défavorables', 'Vérification registres', 'Dossiers judiciaires', 'Analyse structure réseau', 'Couverture langue source'],
    }));
  }, []);

  const setEntity = useCallback((entity: Partial<OrderEntity>) => {
    setState((s) => ({ ...s, entity: { ...s.entity, ...entity } }));
  }, []);

  const setJurisdictions = useCallback((jurisdictions: string[]) => {
    setState((s) => ({ ...s, jurisdictions }));
  }, []);

  const setPriorityAreas = useCallback((priorityAreas: string[]) => {
    setState((s) => ({ ...s, priorityAreas }));
  }, []);

  const setLanguages = useCallback((languages: string[]) => {
    setState((s) => ({ ...s, languages }));
  }, []);

  const setSpecialInstructions = useCallback((specialInstructions: string) => {
    setState((s) => ({ ...s, specialInstructions }));
  }, []);

  const confirmOrder = useCallback((): string => {
    const prefix = state.selectedTier === 'investigation' ? 'CG-INV' : 'CG-DD';
    const seq = String(42 + orders.length).padStart(4, '0');
    const orderId = `${prefix}-2026-${seq}`;
    const now = new Date().toISOString();

    const turnaroundDays = state.selectedTier === 'investigation' ? 2 : 10;
    const delivery = new Date(Date.now() + turnaroundDays * 86400000).toISOString();

    const newOrder: Order = {
      id: orderId,
      entity: { ...state.entity },
      tier: state.selectedTier!,
      status: 'received',
      jurisdictions: [...state.jurisdictions],
      priorityAreas: [...state.priorityAreas],
      languages: [...state.languages],
      specialInstructions: state.specialInstructions,
      price: 'Forfait Taskforce RDC',
      orderedAt: now,
      estimatedDelivery: delivery,
      statusHistory: [
        { status: 'received', timestamp: now, label: 'Commande reçue' },
      ],
      report: null,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setState((s) => ({ ...s, orderId, orderedAt: now, estimatedDelivery: delivery }));

    return orderId;
  }, [state, orders.length]);

  const resetOrder = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const getOrder = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders],
  );

  const completedCount = orders.filter((o) => o.status === 'completed').length;

  return (
    <OrderContext.Provider
      value={{
        state,
        orders,
        setTier,
        setEntity,
        setJurisdictions,
        setPriorityAreas,
        setLanguages,
        setSpecialInstructions,
        confirmOrder,
        resetOrder,
        getOrder,
        completedCount,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used inside <OrderProvider>');
  return ctx;
}
