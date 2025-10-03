import { TangibleObject } from '../types';

export interface InternalContextDescriptor {
  tangibleObjects?: Array<TangibleObject>;
  setTangibleObjets: (tangibleObjects: Array<TangibleObject>) => void;
}
// export interface ContextEvent {
//   id: string;
//   x: number;
//   y: number;
// }