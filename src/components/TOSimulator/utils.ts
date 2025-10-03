export function simulateTouchEvent(element : HTMLElement, type : string, touches : Array<any>, changedTouches? : Array<any>) {
    let listTouch : Array<Touch> = [];
  
    touches.forEach((touch) => {
        listTouch.push(new Touch({
        clientX: touch.x,
        clientY: touch.y,
        identifier: touch.id,
        target: element,
      }));
    });

    let listChangedTouch : Array<Touch> = [];
    
    if(changedTouches){
        changedTouches.forEach((touch) => {
          listChangedTouch.push(new Touch({
          clientX: touch.x,
          clientY: touch.y,
          identifier: touch.id,
          target: element,
        }));
      });
    }
    
    // Compatibilité avec firefox ?
    element.dispatchEvent(new TouchEvent(type, {
      touches: listTouch,
      view: window,
      cancelable: true,
      bubbles: true,
      altKey: true,
      changedTouches:listChangedTouch
    }));
  }

function circleIntersection(
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number
  ): { x: number, y: number }[] | null {
    // Calculate the distance between the centers
    const d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  
    // Check if the circles are too far apart or one is contained within the other
    if (d > r1 + r2 || d < Math.abs(r1 - r2)) {
      return null; // No intersection
    }
  
    // Check if the circles are coincident
    if (d === 0 && r1 === r2) {
      return null; // Infinite intersection points
    }
  
    // Calculate the distance from the first circle's center to the line connecting the intersection points
    const a = (r1 ** 2 - r2 ** 2 + d ** 2) / (2 * d);

    const x3 = x1 + ((x2 - x1) * a/d);
    const y3 = y1 + ((y2 - y1) * a/d)
  
    // Calculate the coordinates of the point where the line through the intersection points crosses the line between the centers
    const h = Math.sqrt(r1 ** 2 - a ** 2);
    const rx = - (y2 - y1) * (h/d)
    const ry = (x2 - x1) * (h/d)
  
    // Calculate the intersection points
    const intersectionX1 = x3 + rx;
    const intersectionX2 = x3 - rx;
    const intersectionY1 = y3 + ry;
    const intersectionY2 = y3 - ry;
  
    // Return the intersection points
    return [
      { x: intersectionX1, y: intersectionY1 },
      { x: intersectionX2, y: intersectionY2 }
    ];
  }


export function calculateTrianglePoints(
    distAB: number,
    distBC: number,
    distCA: number,
    theta: number
  ): { A: [number, number], B: [number, number], C: [number, number] } | null {
    // Convert theta to radians
    const thetaRad = theta * Math.PI / 180;
  
    // Calculate coordinates of point A (we'll start with A at the origin)
    const Ax = 0;
    const Ay = 0;
  
    // Calculate coordinates of point B
    const Bx = distAB * Math.cos(thetaRad);
    const By = distAB * Math.sin(thetaRad);

    let result = circleIntersection(Ax, Ay, distCA, Bx, By, distBC);

    if(result === null){
        return null;
    }
  
    // Calculate coordinates of point C
    const Cx = result[0].x;
    const Cy = result[0].y;
  
    // Calculate the centroid (average point)
    const centroidX = (Ax + Bx + Cx) / 3;
    const centroidY = (Ay + By + Cy) / 3;
  
    // Adjust all points so that the centroid is at (0, 0)
    const adjustedA: [number, number] = [Ax - centroidX, Ay - centroidY];
    const adjustedB: [number, number] = [Bx - centroidX, By - centroidY];
    const adjustedC: [number, number] = [Cx - centroidX, Cy - centroidY];
  
    return { A: adjustedA, B: adjustedB, C: adjustedC };
}

export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
};