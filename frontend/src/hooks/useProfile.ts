import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';
import type { EntityProfile, EntityProfileRequest } from '../types/profile';

interface UseProfileReturn {
  profile: EntityProfile | null;
  loading: boolean;
  error: string | null;
  generateProfile: (request: EntityProfileRequest) => Promise<void>;
  setProfileDirect: (profile: EntityProfile) => void;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<EntityProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateProfile = useCallback(async (request: EntityProfileRequest) => {
    setLoading(true);
    setError(null);
    setProfile(null);

    try {
      const result = await apiClient.generateProfile(request);
      setProfile(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const setProfileDirect = useCallback((p: EntityProfile) => {
    setError(null);
    setLoading(false);
    setProfile(p);
  }, []);

  return { profile, loading, error, generateProfile, setProfileDirect };
}
