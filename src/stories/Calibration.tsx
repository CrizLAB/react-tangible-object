/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { useEffect, useState, } from 'react';

import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useTangibleObjectDataStore } from './useTangibleObjectDataStore';


interface TOCalibrationProps{
    idTO? : string;
    simulatorKey? : string;
}

export const TOCalibration : React.FC<TOCalibrationProps> = ({idTO, simulatorKey} : TOCalibrationProps) => {

    const [dist1List, setdist1List] = useState<number[]>([]);
    const [dist2List, setdist2List] = useState<number[]>([]);
    const [dist3List, setdist3List] = useState<number[]>([]);

    const [dist1Avg, setdist1Avg] = useState<number>(0);
    const [dist2Avg, setdist2Avg] = useState<number>(0);
    const [dist3Avg, setdist3Avg] = useState<number>(0);

    const [progress, setProgress] = useState<number>(0);

    const [touchList, setTouchList] = useState<TouchList | null>(null);

    const [touchA, setTouchA] = useState<React.Touch | null>(null);
    const [touchB, setTouchB] = useState<React.Touch | null>(null);
    const [touchC, setTouchC] = useState<React.Touch | null>(null);

    const [started, setStarted]  = useState<boolean>(false);
    const [aborted, setAborted] = useState<boolean>(false);

    const progressToReach = 1000;

    //const {tangibleObjectDataList, setTangibleObjectDataList}  = useTangibleObjectDataContext();

    const addTangibleObjectData = useTangibleObjectDataStore((state) => state.addTangibleObjectData);

    useEffect(() => {
        document.addEventListener("touchmove", (event) => {setTouchList(event.touches);}, {passive:false});
        document.addEventListener("touchstart", (event) => {setTouchList(event.touches);}, {passive:false});
        document.addEventListener("touchend", (event) => {setTouchList(event.touches);}, {passive:false});
    }, []);

    useEffect(() => {

        if(dist1List.length === 0){
            setdist1Avg(0);
        }
        else{
            var sum = 0;
            dist1List.forEach((value) => {
                sum += value;
            })
            setdist1Avg(sum/dist1List.length);
        }
        
        
    }, [dist1List]);

    useEffect(() => {

        if(dist2List.length === 0){
            setdist2Avg(0);
        }
        else{
            var sum = 0;
            dist2List.forEach((value) => {
                sum += value;
            })
            setdist2Avg(sum/dist2List.length);
        }
        
        
    }, [dist2List]);

    useEffect(() => {

        if(dist3List.length === 0){
            setdist3Avg(0);
        }
        else{
            var sum = 0;
            dist3List.forEach((value) => {
                sum += value;
            })
            setdist3Avg(sum/dist3List.length);
        }
        
        
    }, [dist3List]);

    useEffect(() => {
        setProgress(Math.max(dist1List.length, dist2List.length, dist3List.length));
    }, [dist1List, dist2List, dist3List]);

    useEffect(() => {
        if(progress >= progressToReach){
            console.log({
                dist1 : dist1Avg,
                dist2 : dist2Avg,
                dist3 : dist3Avg
            });
        }
    }, [progress])


    useEffect(() => {

        if(!touchList){
            return;
        }

        if(touchList.length > 3){
            return;
        }

        if(touchList.length <= 2){
            if(started){
                setAborted(true);
            }
            return;
        }

        if(aborted){
            return;
        }
        
        if(!started){
            setStarted(true);
        }
        
        for(let i = 0; i < touchList.length; i++){
            let touch = touchList.item(i);
            if(!touch){
                continue;
            }

            if(touchA && touchA.identifier === touch.identifier){
                setTouchA(touch);
                continue;
            }
            if(touchB && touchB.identifier === touch.identifier){
                setTouchB(touch);
                continue;
            }
            if(touchC && touchC.identifier === touch.identifier){
                setTouchC(touch);
                continue;
            }
            if(!touchA){
                setTouchA(touch);
                continue;
            }
            if(!touchB){
                setTouchB(touch);
                continue;
            }
            if(!touchC){
                setTouchC(touch);
                continue;
            }
        }
        

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [touchList]);



    useEffect(() => {

        if(!touchA || !touchB || !touchC){
            return;
        }

        const dist1 = Math.sqrt((touchA.clientX - touchB.clientX)**2 + (touchA.clientY - touchB.clientY)**2);
        const dist2 = Math.sqrt((touchB.clientX - touchC.clientX)**2 + (touchB.clientY - touchC.clientY)**2);
        const dist3 = Math.sqrt((touchC.clientX - touchA.clientX)**2 + (touchC.clientY - touchA.clientY)**2);

        if(progress >= progressToReach){
            return;
        }

        setdist1List([...dist1List , dist1]);
        setdist2List([...dist2List , dist2]);
        setdist3List([...dist3List , dist3]);

    }, [touchA, touchB, touchC]);
      

    function textInsideCircle(){
        
        if(progress >= progressToReach){
            return (<p style={{fontSize: 20, fontFamily: 'Arial, sans-serif', textAlign: 'center'} }>
                <strong> Done ! </strong>
                <br />Calibration values were printed in the console !
            </p> );
        }
        else if(aborted){
            return (<p style={{fontSize: 20, fontFamily: 'Arial, sans-serif', textAlign: 'center'}}> 
                Tangible object was lifted.
                <br /><strong> Restart needed.</strong>
            </p>);
        }
        else if(started){
            return <p style={{fontSize: 20,  fontFamily: 'Arial, sans-serif', textAlign: 'center'}}> Keep rotating an moving the object to calibrate</p>;
        }
        else {
            return (<p style={{fontSize: 20,  fontFamily: 'Arial, sans-serif', textAlign: 'center'}}>Put a tangible object<strong> here </strong><br /> to start the calibration</p>);
        }
    }

    return (
    
        <div

            style={
                {
                    width: "100%",
                    height: "100vh",
                    display: 'flex',  
                    justifyContent:'center', 
                    flexDirection: 'column',
                    alignItems:'center', 
                }

            }

            //onTouchStart={(event) => {setTouchList(event.touches);}}

            //onTouchMove={(event) => {setTouchList(event.touches);}}

            //onTouchEnd={(event) => {setTouchList(event.touches);}}

        >
            <div
                style={
                    {
                        width: "60vh",
                        height: "60vh",
                    }
                }
            >
                <CircularProgressbarWithChildren 
                    value={progress}
                    maxValue={progressToReach}
                    styles={buildStyles({
                        // Rotation of path and trail, in number of turns (0-1)
                        rotation: 0.25,
                    
                        // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
                        strokeLinecap: 'butt',
                    
                        // How long animation takes to go from one percentage to another, in seconds
                        pathTransitionDuration: 0.5,
                    
                        // Can specify path transition in more detail, or remove it entirely
                        // pathTransition: 'none',
                    
                        // Colors
                        pathColor: `rgba(62, 152, 199, ${progress / progressToReach})`,
                        textColor: '#f88',
                        trailColor: '#d6d6d6',
                        backgroundColor: '#3e98c7',
                        
                    })}
                >
                    {/* Put any JSX content in here that you'd like. It'll be vertically and horizonally centered. */}
                    <div>
                        {textInsideCircle()}
                    </div>
                    
                </CircularProgressbarWithChildren>

                
        
            </div>


            <p 
                style={{
                    fontSize:16, 
                    fontFamily: 'Arial, sans-serif',
                    textAlign: 'center'
                }}
            >
                    Dist 1: {dist1Avg}, Dist 2: {dist2Avg}, Dist 3: {dist3Avg}
                {""}
            </p>
                    

                {(progress >= progressToReach || aborted) && 
                <div style={{
                    fontSize:20, 
                    fontFamily: 'Arial, sans-serif',
                    textAlign: 'center'
                }}>
                    <p>
                        You can add this tangible object data by filling it's id in the <strong> Controls </strong> below and clicking on the button.
                    </p>
                        <button style={{
                            width: 400,
                            height: 40,
                            fontSize:20, 
                            fontFamily: 'Arial, sans-serif',
                            textAlign: 'center'}}
                            onClick={() => {
                                //TODO: check if TO with this ID already exists
                                if(idTO !== undefined){
                                    addTangibleObjectData({
                                        distAB : dist1Avg,
                                        distBC : dist2Avg,
                                        distCA : dist3Avg,
                                        id : idTO,
                                        simulatorKey : simulatorKey
                                    });
                                }
                            }}
                        >
                            Add calibrated object
                        </button>
                </div>}
            
        </div>
    )
}
