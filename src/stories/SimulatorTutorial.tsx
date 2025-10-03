import React, { useEffect, useState } from 'react';
import { TOCanvas, TOContext, TOInput, TOSimulator } from '../components';
import { useTOContext } from '../hooks';
import { TangibleObjectData } from '../types';
import { useTangibleObjectDataStore } from './useTangibleObjectDataStore';

export type TutorialMode = "DragAndDrop" | "Rotation";

interface SimulatorTutorialTOProps{
    tutorialMode : TutorialMode,

}

export const SimulatorTutorialTO : React.FC<SimulatorTutorialTOProps> = ({tutorialMode} : SimulatorTutorialTOProps) => {

    const tangibleObjectDataList = useTangibleObjectDataStore((state) => state.tangibleObjectDataList)

    return (
    <div>
        <TOContext>
            <TOSimulator tangibleObjectDataList={tangibleObjectDataList}>
                    <TOInput precision={100} tangibleObjectDataList={tangibleObjectDataList}>
                        <TOCanvas zIndex={1}/>
                        <SimulatorTutorial tangibleObjectDataList={tangibleObjectDataList} tutorialMode={tutorialMode}/> 
                    </TOInput>
            </TOSimulator>
        </TOContext>
    </div>)
}

function formatList(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} or ${items[1]}`;
  
    const initialItems = items.slice(0, -1).join(', ');
    const lastItem = items[items.length - 1];
    return `${initialItems}, or ${lastItem}`;
  }

interface SimulatorTutorialProps{
    tangibleObjectDataList : TangibleObjectData[];
    tutorialMode : TutorialMode,
}

const SimulatorTutorial : React.FC<SimulatorTutorialProps> = ({tangibleObjectDataList, tutorialMode} : SimulatorTutorialProps) => {

    const [finalListKeyPress, setFinalListKeyPress] = useState<string[]>([]);
    const {tangibleObjects} = useTOContext();

    function findSimulatorKeyByTOID(id : string) : string | undefined{
        for(let i = 0; i < tangibleObjectDataList.length; i++){
          let tangibleObjectData = tangibleObjectDataList[i];
          if(tangibleObjectData.id === id){
            return tangibleObjectData.simulatorKey;
          }
        }
    
        return undefined;
    }

    useEffect(() => {

        let filteredListKeyPress = [];

        for (let i = 0; i < tangibleObjectDataList.length; i++) {
            const tangibleObjectData = tangibleObjectDataList[i];

            if(tangibleObjectData.simulatorKey === undefined){
                continue;
            }

            if(tangibleObjects){
                let addKey = true;
                for (let j = 0; j < tangibleObjects.length; j++) {
                    const to = tangibleObjects[j];
                    if(to.id === tangibleObjectData.id){
                        addKey = false;
                        break;
                    }
                }

                if(addKey){
                    filteredListKeyPress.push(tangibleObjectData.simulatorKey);
                }
            }
        }

        setFinalListKeyPress(filteredListKeyPress);

    }, [tangibleObjectDataList, tangibleObjects]);

    return(
        <div>
            <div tabIndex={-1}
                style={{
                position: "absolute",
                display : "flex",
                justifyContent: "center",
                width : "100vw",
                height : "100vh",
                alignItems: "center"
            }}>
                <p style={{ fontSize: 40, fontFamily: 'Arial, sans-serif', textAlign: 'center', verticalAlign: 'center', color:"#b0b2b5"}}>
                    Click to focus on the background then press {formatList(finalListKeyPress)}
                </p>
                
            </div>

            {
                tangibleObjects?.map((to) => {
                    return <PopUpTO TOCoords={to.triangle.barycentre} keyPress={findSimulatorKeyByTOID(to.id)} offset={{x: 0, y:-50}} key={to.id} tutorialMode={tutorialMode}></PopUpTO>
                })
            }

        </div>
    )
}

interface PopUpTOProps{
    TOCoords : {x : number, y: number}
    keyPress? : string
    tutorialMode : TutorialMode,
    offset? : {x : number, y: number}
}

const PopUpTO : React.FC<PopUpTOProps> = ({TOCoords, offset = {x: 0, y:0}, keyPress, tutorialMode} : PopUpTOProps) => {

    return (
        <div style={{
            position: 'absolute',
            zIndex: '1000',
            textAlign: 'center',
            fontSize: 20, 
            fontFamily: 'Arial, sans-serif',
            transform: `translate(${TOCoords.x + offset.x}px, ${TOCoords.y + offset.y}px) translate(-50%, -100%)`
        }}>
            <p>
                {tutorialMode === 'DragAndDrop' ? "Drag me !" : "Hover me and scroll up or down !"} <br /> Press <strong> {keyPress} </strong> to remove me !
            </p>

        </div>
    )
}