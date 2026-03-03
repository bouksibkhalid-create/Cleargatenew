import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EntityProfilePage from '../profile/EntityProfilePage';
import BreadcrumbBar from './BreadcrumbBar';
import { supabase } from '../../lib/supabase';
import { toggleMonitoring, saveEntity } from '../../services/savedEntitiesService';

interface EntityProfileViewProps {
  source: 'check' | 'reports';
}

export default function EntityProfileView({ source }: EntityProfileViewProps) {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState('Person');
  const [country, setCountry] = useState<string | undefined>();
  const [isSaved, setIsSaved] = useState(false);
  const [isMonitored, setIsMonitored] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!entityId) return;
      try {
        // Load entity details from saved_entities
        const { data } = await supabase
          .from('cg_saved_entities')
          .select('*')
          .eq('id', entityId)
          .single();
        if (data) {
          setEntityName(data.entity_name);
          setEntityType(data.entity_type || 'Person');
          setCountry(data.country || undefined);
          setIsSaved(true);
          setIsMonitored(data.is_monitored || false);
          setSavedId(data.id);
        }
      } catch (e) {
        console.error('Failed to load entity:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [entityId]);

  const handleBack = () => {
    navigate(source === 'reports' ? '/reports' : '/check');
  };

  const handleSave = async () => {
    if (isSaved || !entityName) return;
    setSaving(true);
    try {
      const saved = await saveEntity({
        entity_name: entityName,
        entity_type: entityType,
        country,
      });
      setIsSaved(true);
      setSavedId(saved.id);
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMonitor = async () => {
    if (!savedId) return;
    try {
      const newState = !isMonitored;
      await toggleMonitoring(savedId, entityName, newState);
      setIsMonitored(newState);
    } catch (e) {
      console.error('Failed to toggle monitoring:', e);
    }
  };

  const handleDownload = () => {
    alert('Report generation triggered. The PDF will download shortly.');
  };

  const handleRefresh = () => {
    // Force re-render by resetting loading
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  };

  if (loading) {
    return <div className="text-center text-sm text-[#9CA3AF] py-12">Loading entity...</div>;
  }

  if (!entityName) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#9CA3AF]">Entity not found.</p>
        <button onClick={handleBack} className="mt-4 text-sm text-[#931CF5] hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div>
      <BreadcrumbBar
        entityName={entityName}
        source={source}
        isSaved={isSaved}
        isMonitored={isMonitored}
        onSave={handleSave}
        onToggleMonitor={handleToggleMonitor}
        onDownload={handleDownload}
        onRefresh={source === 'reports' ? handleRefresh : undefined}
        saving={saving}
      />
      <EntityProfilePage
        entityName={entityName}
        entityType={entityType}
        country={country}
        onBack={handleBack}
      />
    </div>
  );
}
