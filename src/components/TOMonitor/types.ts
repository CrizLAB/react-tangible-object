import { StartEvent } from '../../types';
import { EndEvent } from '../../types';
import { MoveEvent } from '../../types';

export interface TOMonitorListener {
  onTOStart?(event: StartEvent): void;
  onTOEnd?(event: EndEvent): void;
  onTOMove?(event: MoveEvent): void;
}

export interface TOMonitorEvent {
  type: keyof TOMonitorListener;
  event: StartEvent | EndEvent | MoveEvent;
}

export type UnregisterListener = () => void;

export type RegisterListener = (
  listener: TOMonitorListener
) => UnregisterListener;
