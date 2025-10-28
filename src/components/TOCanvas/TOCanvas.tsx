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

export const TOCanvas: React.FC<TOCanvasProps> = ({ zIndex = 1 }) => {
  const { tangibleObjects } = useTOContext();
  const touchInfosContext = useContext(TouchInfosContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  const tangibleObjectsRef = useRef(tangibleObjects);
  const touchInfosRef = useRef(touchInfosContext);

  tangibleObjectsRef.current = tangibleObjects;
  touchInfosRef.current = touchInfosContext;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { current: currentTouchInfos } = touchInfosRef;
      const { current: currentTangibleObjects } = tangibleObjectsRef;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.fillStyle = 'black';
      ctx.font = '14px monospace';
      ctx.textBaseline = 'top';

      let y = 5;
      const touchInfos = currentTouchInfos?.current;
      if (touchInfos) {
        Object.values(touchInfos).forEach((touchInfo) => {
          const {
            touchIdentifier,
            lastTouch,
            shiftedTouchIdentifier,
            TOId,
            touchStartOnHold,
          } = touchInfo;

          const line = `ID:${touchIdentifier}  X:${Math.round(
            lastTouch.clientX
          )}  Y:${Math.round(lastTouch.clientY)}  ShiftedIdentifier:${
            shiftedTouchIdentifier ?? '-'
          }  TOId:${TOId ?? '-'}  StartEventOnHold:${touchStartOnHold}`;

          ctx.fillText(line, 5, y);
          y += 18;
        });
      }

      if (currentTangibleObjects && currentTangibleObjects.length > 0) {
        const path = new Path2D();
        for (let i = 0; i < currentTangibleObjects.length; i++) {
          creaTriangle(
            ctx,
            path,
            currentTangibleObjects[i].triangle,
            currentTangibleObjects[i].angle
          );
        }
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      id="canva"
      className="canvas"
      width={window.innerWidth}
      height={window.innerHeight}
      ref={canvasRef}
      style={{
        height: '100vh',
        width: '100vw',
        position: 'absolute',
        pointerEvents: 'none',
        border: '2px solid red',
        boxSizing: 'border-box',
        zIndex,
      }}
    />
  );
};
