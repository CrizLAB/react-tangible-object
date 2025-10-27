import React from 'react';
import { TOCanvas, TOContext, TOInput, TOSimulator} from '../components';
import { useTOContext } from '../hooks';
import { buildStyles, CircularProgressbar} from 'react-circular-progressbar';
import { useTangibleObjectDataStore } from './useTangibleObjectDataStore';
import { TouchHandlingMode } from '../components/TOInput/TOInput';



interface UsingRotationExampleTOProps{
    precision : number;
    touchHandlingMode : TouchHandlingMode
}

export const UsingRotationExampleTO : React.FC<UsingRotationExampleTOProps> = ({precision, touchHandlingMode} : UsingRotationExampleTOProps) => {


    const tangibleObjectDataList = useTangibleObjectDataStore((state) => state.tangibleObjectDataList)
   
    return (
    <div>
        <TOContext>
            <TOSimulator tangibleObjectDataList={tangibleObjectDataList}>
                <TOInput precision={precision} tangibleObjectDataList={tangibleObjectDataList} touchHandlingMode={touchHandlingMode} simulateClicks={true}>
                        <TOCanvas/>
                        <CircularProgessBarExample/>
                    </TOInput>
            </TOSimulator>
        </TOContext>
    </div>)
}



interface CircularProgessBarExampleProps{

}

const CircularProgessBarExample : React.FC<CircularProgessBarExampleProps> = ({} : CircularProgessBarExampleProps) => {


    const {tangibleObjects} = useTOContext();

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
        {
            tangibleObjects && tangibleObjects.map(
                (to) => {
                    return (
                    <div style={{
                        position: "absolute",
                        top: to.triangle.barycentre.y - to.radius - 50,
                        left: to.triangle.barycentre.x - to.radius - 50,
                        width : to.radius * 2 + 100,
                        height : to.radius * 2 +100
                        
                    }}>
                        <CircularProgressbar
                            value={to.angle} 
                            maxValue={360} 
                            minValue={0} 
                            
                            styles={buildStyles({
                                // Rotation of path and trail, in number of turns (0-1)
                                rotation: 0.25,
                            
                                // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
                                strokeLinecap: 'butt',
                            
                                // Text size
                                textSize: '16px',
                            
                                // How long animation takes to go from one percentage to another, in seconds
                                pathTransitionDuration: 0.0,
                            
                                // Can specify path transition in more detail, or remove it entirely
                                // pathTransition: 'none',
                            
                                // Colors
                                pathColor: `rgb(62, 152, 199)`,
                                textColor: '#f88',
                                trailColor: '#d6d6d6',
                                backgroundColor: '#3e98c7',
                              })}>
                                
                        </CircularProgressbar>
                        <p 
                            style={{
                                 transform : "translate(0, -100%)",
                                 fontSize: 40, 
                                 fontFamily: 'Arial, sans-serif', 
                                 textAlign: 'center', 
                                 verticalAlign: 'center', 
                                 color:"#b0b2b5",
                                }}>
                            {`${Math.floor((to.angle)/360 * 100)}%`}
                        </p>
                    </div>)
                }
            )
        }

        <p 
            style={{ fontSize: 40, fontFamily: 'Arial, sans-serif', textAlign: 'center', verticalAlign: 'center', color:"#b0b2b5"}}>
            Use tangible objects rotation to control sliders
        </p>
    </div>)

}