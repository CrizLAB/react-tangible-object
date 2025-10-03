import React, { useContext, useEffect, useRef } from 'react';
import { useTOContext } from '../../hooks';
import { Triangle } from '../../types/triangle';
import { TouchInfosContext } from '../TOInput';
//import '../CSS/styleComponent.css'

interface TOCanvasProps{
  //targetRef: React.RefObject<HTMLElement | null>;
  zIndex? : number;
}

// Permet de créer un triangle pour avoir le feedback
export function creaTriangle(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  triangle: Triangle,
  angle: number
) {
  
  path.moveTo(triangle.A.x, triangle.A.y);
  path.lineTo(triangle.B.x, triangle.B.y);
  path.lineTo(triangle.C.x, triangle.C.y);
  path.lineTo(triangle.A.x, triangle.A.y);
  
  ctx.fillStyle = 'rgb(200, 0, 0)';
  ctx.fill(path);
  ctx.stroke(path);

  ctx.font = 'bold 10px Verdana, Arial, serif';
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillText(
    '' + Math.round(angle),
    triangle.barycentre.x + 30,
    triangle.barycentre.y + 30
  );
}

export const TOCanvas : React.FC<TOCanvasProps> = ({zIndex = 1} : TOCanvasProps) => {
  // a chaque fois que tangibleObjects est modifié, on recrée le triangle
  const { tangibleObjects } = useTOContext();
  const touchInfosContext = useContext(TouchInfosContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  //const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {

    //console.log("tangibleObjectsCanvas", tangibleObjects);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      // clear tout le dessin et récupère un chemin de dessin
      ctx.clearRect(0, 0, screen.width, screen.height);

      ctx.fillStyle = "black";
      ctx.font = "14px monospace";
      ctx.textBaseline = "top";

      let y = 5; 

      Object.values(touchInfosContext).forEach((touchInfo) => {
        const {
          touchIdentifier,
          lastTouch,
          shiftedTouchIdentifier,
          TOId,
          touchStartOnHold,
        } = touchInfo;

        const line = `ID:${touchIdentifier}  X:${Math.round(lastTouch.clientX)}  Y:${Math.round(lastTouch.clientY)}  ShiftedIdentifier:${shiftedTouchIdentifier ?? "-"}  TOId:${TOId ?? "-"}  StartEventOnHold:${touchStartOnHold}`;

        ctx.fillText(line, 5, y);
        y += 18; 
      });

      if(tangibleObjects){
        const path = new Path2D();

        for (let i = 0; i < tangibleObjects.length; i++) {        
          creaTriangle(
            ctx,
            path,
            tangibleObjects[i].triangle,
            tangibleObjects[i].angle
          );
        }
      }
      
    }

  }, [tangibleObjects, touchInfosContext]);


  /*

  useEffect(() => {

    const updateCanvasPosition = () => {
      

      const target = targetRef.current;
      const canvas = canvasRef.current;
      if (!target || !canvas) return;

      const rect = target.getBoundingClientRect();

      setStyle({
        position: 'absolute',
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        pointerEvents: 'none',
        border: "2px solid red",
        transform: getComputedStyle(target).transform,
        zIndex: zIndex,
      });

      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateCanvasPosition();

    const resizeObserver = new ResizeObserver(updateCanvasPosition);
    if (targetRef.current) {
      resizeObserver.observe(targetRef.current);
    }

    window.addEventListener('scroll', updateCanvasPosition);
    window.addEventListener('resize', updateCanvasPosition);

    return () => {
      window.removeEventListener('scroll', updateCanvasPosition);
      window.removeEventListener('resize', updateCanvasPosition);
      resizeObserver.disconnect();
    };
  }, [targetRef]);

  */

  return (
    <canvas
      id="canva"
      className="canvas"
      width={window.innerWidth}
      height={window.innerHeight}
      ref={canvasRef}
      style={{
        height: "100vh",
        width : "100vw",
        position: 'absolute',
        pointerEvents: 'none',
        
        border: "2px solid red",
        boxSizing: "border-box",
        zIndex: zIndex,
      }}
    />
  );
};

// if (C.x > mAB.x && C.y > mAB.y) {
//   path.lineTo(C.x + k, C.y + k);
//
// if (C.x > mAB.x && C.y < mAB.y) {
//   path.lineTo(C.x + k, C.y - k);
// }
// if (C.x < mAB.x && C.y > mAB.y) {
//   path.lineTo(C.x - k, C.y + k);
// }
// if (C.x < mAB.x && C.y < mAB.y) {
//   path.lineTo(C.x - k, C.y - k);
// }
