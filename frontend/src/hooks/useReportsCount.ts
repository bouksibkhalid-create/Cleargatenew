import { useState, useEffect, useCallback } from 'react';
import { getSavedEntitiesCount } from '../services/savedEntitiesService';

export function useReportsCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const c = await getSavedEntitiesCount();
    setCount(c);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { count, refresh };
}
