import { createContext } from 'react';
import type { InternalContextDescriptor } from './types';

export const defaultInternalContext: InternalContextDescriptor = {
  tangibleObjects: [],
  setTangibleObjets: function (..._args: any) { },
};

// export const EventInternalContext: InternalEventDescriptor = {
//   tangibleObjects: [],
//   setTangibleObjets: function (..._args: any) { }
// };
export const InternalContext = createContext<InternalContextDescriptor>(defaultInternalContext);
