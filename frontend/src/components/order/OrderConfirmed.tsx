import { useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, LayoutDashboard } from 'lucide-react';
import OrderProgressStepper from './OrderProgressStepper';
import { useOrder } from '../../context/OrderContext';

export default function OrderConfirmed() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { state, resetOrder, getOrder } = useOrder();

  const order = orderId ? getOrder(orderId) : undefined;

  // Reset order state after viewing confirmation
  useEffect(() => {
    return () => {
      resetOrder();
    };
  }, []);

  if (!order && !state.orderId) return <Navigate to="/order/select" replace />;

  const displayId = orderId || state.orderId || '';
  const delivery = order?.estimatedDelivery || state.estimatedDelivery;
  const deliveryDate = delivery
    ? new Date(delivery).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div>
      <OrderProgressStepper currentStep={4} />

      <div className="max-w-lg mx-auto text-center py-8">
        {/* Animated checkmark */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-20 h-20 rounded-full bg-[#00D4AA]/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-[#00D4AA] flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Commande confirmée
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Votre demande a été enregistrée avec succès
        </p>

        {/* Order details */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-left space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Référence</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{displayId}</span>
          </div>
          {order && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Entité</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{order.entity.name}</span>
            </div>
          )}
          {order && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Niveau</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: order.tier === 'investigation' ? '#00D4AA' : '#8B5CF6' }}
              >
                {order.tier === 'investigation' ? 'Investigation' : 'Due Diligence'}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Date estimée de livraison</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{deliveryDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#00D4AA] hover:bg-[#00BF99] rounded-xl min-h-[48px] transition-colors"
          >
            Voir mes commandes <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[48px] transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
}
