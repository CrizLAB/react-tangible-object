import { Point } from "./point";


/**
 * Find the coordinates of the third vertex of a triangle
 * given P1, P2, and the distances r1 = |P1P3|, r2 = |P2P3|.
 * Optionally, supply the angle at P1 (in radians) to disambiguate.
 */
function findThirdPoint(
    P1: Point,
    P2: Point,
    r1: number,
    r2: number,
    angleAtP1: number,
    tol: number = 1e-6
  ): Point | null{
    const dx = P2.x - P1.x;
    const dy = P2.y - P1.y;
    const d = Math.hypot(dx, dy);
  
    if (d === 0) throw new Error("P1 and P2 cannot be the same point");
  
    // feasibility check
    if (d > r1 + r2 + 1e-12 || d < Math.abs(r1 - r2) - 1e-12) {
      return null; // no intersection
    }
  
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const xm = P1.x + (a * dx) / d;
    const ym = P1.y + (a * dy) / d;
  
    const hSq = Math.max(0, r1 * r1 - a * a);
    const h = Math.sqrt(hSq);
  
    // offset vector perpendicular to P1P2
    const rx = (-dy * h) / d;
    const ry = (dx * h) / d;
  
    const cand1: Point = { x: xm + rx, y: ym + ry };
    const cand2: Point = { x: xm - rx, y: ym - ry };
  
    if (h === 0) return cand1; // touching circles: unique solution
  
    
  
    // Helper: compute signed angle between P1→P2 and P1→candidate
    const signedAngle = (P: Point): number => {
      const vx = dx, vy = dy;
      const wx = P.x - P1.x, wy = P.y - P1.y;
      const dot = vx * wx + vy * wy;
      const cross = vx * wy - vy * wx;
      return Math.atan2(cross, dot); // range -π..π
    };

    
    //A refaire 
    const a1 = Math.abs(signedAngle(cand1));
    const a2 = Math.abs(signedAngle(cand2));

    //console.log(a1, a2)
    return Math.abs(a1 - angleAtP1) + tol > Math.abs(a2 - angleAtP1) 
      ? cand1
      : cand2;
}

export class Triangle {
    A: Point;
    B: Point;
    C: Point;
    distanceAB: number;
    distanceBC: number;
    distanceCA: number;
    barycentre: Point;
    
    
    constructor(A: Point, B: Point, C: Point) {
        this.A = A;
        this.B = B;
        this.C = C;
        this.distanceAB = this.distance(A, B);
        this.distanceBC = this.distance(B, C);
        this.distanceCA = this.distance(C, A);
        this.barycentre = { x: Math.abs(A.x + B.x + C.x) / 3, y: Math.abs(A.y + B.y + C.y) / 3 };
    }

    public updateFromABC(A: Point, B: Point, C: Point){
        this.A = A;
        this.B = B;
        this.C = C;
        this.updateBarycentre();
    }

    public updateFromAB(A: Point, B: Point, angleA: number){
        this.A = A;
        this.B = B;
        let thirdPoint = findThirdPoint(A, B, this.distanceCA, this.distanceBC, angleA);
        
        if(!thirdPoint){
            return;
        }

        this.C = thirdPoint;
        this.updateBarycentre();
    }

    public updateFromBC(B: Point, C: Point, angleB: number){
        this.B = B;
        this.C = C;
        let thirdPoint = findThirdPoint(B, C, this.distanceAB, this.distanceCA, angleB);
        
        if(!thirdPoint){
            return;
        }

        this.A = thirdPoint;
        this.updateBarycentre();
    }

    public updateFromCA(C: Point, A: Point, angleC: number){
        this.C = C;
        this.A = A;
        let thirdPoint = findThirdPoint(C, A, this.distanceBC, this.distanceCA, angleC);
        
        if(!thirdPoint){
            return;
        }

        this.B = thirdPoint;
        this.updateBarycentre();
    }



    updateBarycentre(){
        this.barycentre = { x: Math.abs(this.A.x + this.B.x + this.C.x) / 3, y: Math.abs(this.A.y + this.B.y + this.C.y) / 3 }
    }

    distance(point1: { x: number, y: number }, point2: { x: number, y: number }) {
        return (Math.sqrt((point1.y - point2.y) ** 2 + (point1.x - point2.x) ** 2));
    }

}