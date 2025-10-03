import { Point } from "./point";

interface TOEvent {
  idTO: string;
  barycentre: Point;
  angle: number;
  radius: number;
}

export interface StartEvent extends TOEvent { }

export interface EndEvent extends TOEvent { }

export interface MoveEvent extends TOEvent { }
