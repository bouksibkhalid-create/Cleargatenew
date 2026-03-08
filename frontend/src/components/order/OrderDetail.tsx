import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Check, FileSearch } from 'lucide-react';
import CgCard from '../common/CgCard';
import OrderStatusTimeline from './OrderStatusTimeline';
import InvestigationReportView from './InvestigationReport';
import { useOrder } from '../../context/OrderContext';
import { JURISDICTION_OPTIONS, LANGUAGE_OPTIONS } from '../../data/mockOrders';

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrder } = useOrder();

  const order = orderId ? getOrder(orderId) : undefined;

  if (!order) {
    return <Navigate to="/orders" replace />;
  }

  const jurisdictionLabels = order.jurisdictions.map(
    (v) => JURISDICTION_OPTIONS.find((j) => j.value === v)?.label ?? v,
  );
  const languageLabels = order.languages.map(
    (v) => LANGUAGE_OPTIONS.find((l) => l.value === v)?.label ?? v,
  );

  return (
    <div>
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors min-w-[36px] min-h-[36px]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{order.entity.name}</h1>
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
              style={{ background: order.tier === 'investigation' ? '#00D4AA' : '#8B5CF6' }}
            >
              {order.tier === 'investigation' ? 'Investigation' : 'Due Diligence'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{order.id}</p>
        </div>
      </div>

      {/* Status Timeline */}
      <CgCard title="Progression" className="mb-6">
        <OrderStatusTimeline
          statusHistory={order.statusHistory}
          currentStatus={order.status}
          tier={order.tier}
        />
      </CgCard>

      {/* Order Details */}
      <CgCard title="Détails de la commande" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Entité</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{order.entity.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {order.entity.type === 'person' ? 'Personne physique' : order.entity.type === 'organization' ? 'Organisation' : 'Navire'}
            </div>
            {order.entity.aliases.length > 0 && (
              <div className="text-xs text-slate-400 mt-1">Alias : {order.entity.aliases.join(', ')}</div>
            )}
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Prix</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">{order.price}</div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Date de commande</div>
            <div className="text-sm text-slate-700 dark:text-slate-300">
              {new Date(order.orderedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Livraison estimée</div>
            <div className="text-sm text-slate-700 dark:text-slate-300">
              {new Date(order.estimatedDelivery).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Jurisdictions */}
        <div className="mt-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Juridictions</div>
          <div className="flex flex-wrap gap-1.5">
            {jurisdictionLabels.map((label) => (
              <span key={label} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Priority Areas */}
        <div className="mt-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Domaines prioritaires</div>
          <ul className="space-y-1">
            {order.priorityAreas.map((area) => (
              <li key={area} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className="w-3.5 h-3.5 text-[#00D4AA] flex-shrink-0" />
                {area}
              </li>
            ))}
          </ul>
        </div>

        {/* Languages */}
        {languageLabels.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Langues source</div>
            <div className="flex flex-wrap gap-1.5">
              {languageLabels.map((label) => (
                <span key={label} className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Instructions spécifiques</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              "{order.specialInstructions}"
            </p>
          </div>
        )}
      </CgCard>

      {/* Report Section */}
      {order.status === 'completed' && order.report ? (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-[#00D4AA]" />
            Rapport d'investigation
          </h2>
          <InvestigationReportView report={order.report} tier={order.tier} />
        </div>
      ) : (
        <CgCard>
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
              <FileSearch className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Le rapport sera disponible une fois l'analyse terminée.
            </p>
          </div>
        </CgCard>
      )}
    </div>
  );
}
