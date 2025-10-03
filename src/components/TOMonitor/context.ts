import {createContext} from 'react';

import type {RegisterListener} from './types';

export const TOMonitorContext = createContext<RegisterListener | null>(null);
