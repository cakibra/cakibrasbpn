import { useEffect } from 'react';
import type { RuntimeSnapshot } from '../types';
import { getConnectionSnapshot } from '../services/bridge';
import { normalizeError } from '../lib/utils';

export function useRuntimePoll(onSnapshot: (snapshot: RuntimeSnapshot) => void, onError?: (message: string) => void): void {
  useEffect(() => {
    let active = true;
    const pull = async () => {
      try {
        const snapshot = await getConnectionSnapshot();
        if (active) onSnapshot(snapshot);
      } catch (error) {
        if (active && onError) onError(normalizeError(error));
      }
    };
    void pull();
    const timer = window.setInterval(() => void pull(), 2200);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [onError, onSnapshot]);
}
