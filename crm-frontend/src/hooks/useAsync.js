import { useCallback, useEffect, useState } from 'react';

// Runs an asynsssssssc loader when `deps` change. Returns { status, data, error, reload, setData }.
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, status: 'loading', error: null }));
    loader()
      .then((data) => {
        if (active) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        if (active) setState({ status: 'error', data: null, error });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const setData = useCallback((updater) => {
    setState((s) => ({
      ...s,
      data: typeof updater === 'function' ? updater(s.data) : updater,
    }));
  }, []);

  return { ...state, reload, setData };
}
