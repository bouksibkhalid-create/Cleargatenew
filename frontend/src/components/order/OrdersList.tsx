import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronRight, Download } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import CgCard from '../common/CgCard';
import { useOrder } from '../../context/OrderContext';
import type { OrderStatus } from '../../types/order';

const STATUS_BADGES: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  received: { label: 'Commande reçue', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300' },
  data_collection: { label: 'Collecte de données', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
  analysis: { label: 'Analyse en cours', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
  analyst_review: { label: 'Revue analyste', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300' },
  completed: { label: 'Rapport disponible', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300' },
};

export default function OrdersList() {
  const navigate = useNavigate();
  const { orders } = useOrder();

  return (
    <div>
      <PageHeader
        icon={<ClipboardList className="w-6 h-6 text-[#9E59EF]" />}
        title="Commandes"
        subtitle="Suivez l'avancement de vos investigations et due diligences"
      />

      <CgCard noPadding>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Aucune commande pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Référence</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Entité</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:table-cell">Niveau</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden lg:table-cell">Livraison estimée</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const badge = STATUS_BADGES[order.status];
                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{order.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{order.entity.name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          {order.entity.type === 'person' ? 'Personne' : order.entity.type === 'organization' ? 'Organisation' : 'Navire'}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ background: order.tier === 'investigation' ? '#00D4AA' : '#8B5CF6' }}
                        >
                          {order.tier === 'investigation' ? 'Investigation' : 'Due Diligence'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex text-[11px] font-medium px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                        {new Date(order.orderedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                        {new Date(order.estimatedDelivery).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {order.status === 'completed' && (
                            <button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-[#00D4AA] transition-colors min-w-[24px] min-h-[24px]"
                              title="Voir le rapport"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors min-w-[24px] min-h-[24px]"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CgCard>
    </div>
  );
}
