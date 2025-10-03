import { useContext } from 'react';
import { InternalContext } from '../store';

export function useTOContext() {
  return useContext(InternalContext);
}
