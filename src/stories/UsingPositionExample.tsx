import React, { useEffect, useRef, useState } from 'react';
import { TOCanvas, TOContext, TOInput, TOSimulator} from '../components';
import { useTOContext } from '../hooks';
import { TangibleObject } from '../types';
import { useTangibleObjectDataStore } from './useTangibleObjectDataStore';
import { TouchHandlingMode } from '../components/TOInput/TOInput';

type UsingPositionExampleMode = "Collision" | "Polygon";

interface UsingPositionExampleTOProps{
    mode : UsingPositionExampleMode;
    precision : number;
    touchHandlingMode : TouchHandlingMode
}

export const UsingPositionExampleTO : React.FC<UsingPositionExampleTOProps> = ({mode, precision = 100, touchHandlingMode} : UsingPositionExampleTOProps) => {

    //const {tangibleObjectDataList, setTangibleObjectDataList} = useTangibleObjectDataContext();

    const tangibleObjectDataList = useTangibleObjectDataStore((state) => state.tangibleObjectDataList);

    return (
    <div>
        <TOContext>
            <TOSimulator tangibleObjectDataList={tangibleObjectDataList}>
                    <TOInput precision={precision} tangibleObjectDataList={tangibleObjectDataList} touchHandlingMode={touchHandlingMode} simulateClicks={true}>
                        <TOCanvas/>
                        <div>
                            {
                                mode === 'Collision' ? <CollisionExample/>  : <PolygonExemple/>
                            }
                        </div>
                    </TOInput>
            </TOSimulator>
        </TOContext>
    </div>)
}

interface CollisionExampleProps{
    
}

const CollisionExample : React.FC<CollisionExampleProps> = ({} : CollisionExampleProps) => {

    const {tangibleObjects} = useTOContext();

    const divRef = useRef<HTMLDivElement>(null);

    const color1 = "#ef476f";
    const color2 = "#0ead69";

    const [backgroundColor, setBackgroundColor] = useState<string>(color1);

    const checkCollision = (divRect: DOMRect, tangibleObject : TangibleObject): boolean => {
        const { x: circleX, y: circleY } = tangibleObject.triangle.barycentre;
        const { left, right, top, bottom } = divRect;
      
        // Find the closest point on the div to the circle's center
        const closestX = Math.max(left, Math.min(right, circleX));
        const closestY = Math.max(top, Math.min(bottom, circleY));
      
        // Calculate the distance between the circle's center and the closest point
        const distanceX = circleX - closestX;
        const distanceY = circleY - closestY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
        // Check if the distance is less than or equal to the circle's radius
        return distance <= tangibleObject.radius;
      };

    useEffect(() => {
        if(!tangibleObjects){
            return;
        }
        if(!divRef.current){
            return;
        }
        for (let index = 0; index < tangibleObjects.length; index++) {
            const TO = tangibleObjects[index];

            if(checkCollision(divRef.current.getBoundingClientRect(), TO)){
                setBackgroundColor(color2);
                return;
            }
        }
        setBackgroundColor(color1);
    }, [tangibleObjects]);
    

    return(
        <div tabIndex={-1}
            style={{
            display : "flex",
            justifyContent: "center",
            width : "100vw",
            height : "100vh",
            alignItems: "center"
        }}
        >
            <div 
                
                ref={divRef}
                style={{
                    display : "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height:"25vh",
                    width:"25vw",
                    backgroundColor: backgroundColor
                }}
                >
                    <p style={{ fontSize: 25, fontFamily: 'Arial, sans-serif', textAlign: 'center', verticalAlign: 'center', color:"#ffffff", margin: 20}}>
                        This div changes color when it collides with a tangible object 
                    </p>
            </div>
        </div>
    )
}




interface PolygonExampleProps{

}

const PolygonExemple : React.FC<PolygonExampleProps> = ({} : PolygonExampleProps) => {

    const { tangibleObjects } = useTOContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {

        //console.log("tangibleObjectsCanvas", tangibleObjects);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && tangibleObjects) {
          // clear tout le dessin et récupère un chemin de dessin
          ctx.clearRect(0, 0, screen.width, screen.height);
          if(tangibleObjects.length > 2){
            const path = new Path2D();
            path.moveTo(
                tangibleObjects[tangibleObjects.length - 1].triangle.barycentre.x, 
                tangibleObjects[tangibleObjects.length - 1].triangle.barycentre.y
            );
            for (let i = 0; i < tangibleObjects.length; i++) {        
                
                path.lineTo(
                    tangibleObjects[i].triangle.barycentre.x, 
                    tangibleObjects[i].triangle.barycentre.y
                );                
            }
            ctx.fillStyle = '#ef476f';
            ctx.fill(path);
            ctx.stroke(path);
          }
        }
      }, [tangibleObjects]);

      return (
        <div
          tabIndex={-1}
          style={{
            position: "absolute",
            display : "flex",
            justifyContent: "center",
            width : "100vw",
            height : "100vh",
            alignItems: "center",
            
          }}
          >
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
              boxSizing: "border-box",
              
            }}
          />

          
          <p style={{ fontSize: 40, fontFamily: 'Arial, sans-serif', textAlign: 'center', verticalAlign: 'center', color:"#b0b2b5"}}>
              Use at least 3 tangible objects to form a Polygon
          </p>
        </div>
      );
    
}