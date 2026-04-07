import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { ApiError } from '../api/http';

export function useApiData<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [loader, ...deps]);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, loading, error, reload: run, setData };
}
