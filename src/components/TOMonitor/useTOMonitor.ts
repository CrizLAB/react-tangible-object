import {useContext, useEffect} from 'react';

import {TOMonitorContext} from './context';
import type {TOMonitorListener} from './types';

export function useTOMonitor(listener: TOMonitorListener) {
  const registerListener = useContext(TOMonitorContext);

  useEffect(() => {
    if (!registerListener) {
      throw new Error(
        'useTOMonitor must be used within a children of <TOContext>'
      );
    }

    const unsubscribe = registerListener(listener);

    return unsubscribe;
  }, [listener, registerListener]);
}
