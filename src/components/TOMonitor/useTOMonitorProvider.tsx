import { useCallback, useState } from 'react';

import { TOMonitorListener, TOMonitorEvent } from './types';

export function useTOMonitorProvider() {
  const [listeners] = useState(() => new Set<TOMonitorListener>());

  const registerListener = useCallback(
    (listener: TOMonitorListener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    [listeners]
  );

  const dispatch = useCallback(
    ({ type, event }: TOMonitorEvent) => {
      listeners.forEach(listener => listener[type]?.(event as any));
    },
    [listeners]
  );

  return [dispatch, registerListener] as const;
}
