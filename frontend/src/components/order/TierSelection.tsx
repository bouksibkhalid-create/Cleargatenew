import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileSearch } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import OrderProgressStepper from './OrderProgressStepper';
import TierCard from './TierCard';
import { useOrder } from '../../context/OrderContext';
import { TIER_DEFINITIONS } from '../../data/mockOrders';

export default function TierSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTier, setEntity } = useOrder();

  // Pre-fill entity from query params (entry points A & B)
  useEffect(() => {
    const entityName = searchParams.get('entity');
    const entityType = searchParams.get('type') as 'person' | 'organization' | 'vessel' | null;
    if (entityName) {
      setEntity({ name: entityName, ...(entityType ? { type: entityType } : {}) });
    }
  }, [searchParams, setEntity]);

  const handleSelect = (tier: 'investigation' | 'due_diligence') => {
    setTier(tier);
    navigate('/order/configure');
  };

  return (
    <div>
      <PageHeader
        icon={<FileSearch className="w-6 h-6 text-[#9E59EF]" />}
        title="Commander une enquête"
        subtitle="Choisissez le niveau d'investigation adapté à vos besoins"
      />

      <OrderProgressStepper currentStep={1} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TIER_DEFINITIONS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            onSelect={
              tier.isPurchasable
                ? () => handleSelect(tier.id as 'investigation' | 'due_diligence')
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
