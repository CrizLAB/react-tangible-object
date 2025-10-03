import React, { useEffect, useRef, useState } from 'react';

import { DraggableTO } from './draggableItem';
import { Coordinates } from '@dnd-kit/core/dist/types';
import { simulateTouchEvent, shuffle} from './utils';
import { TangibleObjectData } from '../../types';

/**
 * @desc It triggers touch events. Also supports multiple touch events.
 * @param {HTMLElement} element target DOM element
 * @param {string} type type of event
 * @param {Array} touches {x, y, id} position and identifier of the event
 */


interface TOPointInfos{
    coordinates: Coordinates, 
    idTO: string,
    touchIdentifier: number,
    isPointA: boolean, 
    isPointB: boolean, 
    isPointC: boolean, 
}

export interface Props {
  //fichier de config de TO
  children?: React.ReactNode;
  tangibleObjectDataList : TangibleObjectData[];
}

export const TOSimulator = ({ children, tangibleObjectDataList} : Props) => {

  const [listDraggableTO, setListDraggableTO] = useState<React.ReactElement[]>([]);
  const [dictDraggableTO, setDictDraggableTO] = useState<{[id: string]:React.ReactElement}>({});
  const TOPointInfosList = useRef<TOPointInfos[]>([]);
  const [TOPointInfosListToAdd, setTOPointInfoListToAdd] = useState<TOPointInfos[]>([]);
  const [TOPointInfosListToRemove, setTOPointInfoListToRemove] = useState<TOPointInfos[]>([]);

  const [mouseCoord, setMouseCoord] = useState<Coordinates>({x: 0, y:0});

  const startIdentifier = 20;
  

  function  handleOnStart(
    id: string,
    centerCoordinates: Coordinates,
    pointA: Coordinates,
    pointB: Coordinates,
    pointC: Coordinates) : void{

    //console.log("HandleOnStart", centerCoordinates, pointA, pointB, pointC);

    setTOPointInfoListToAdd(
      [...TOPointInfosListToAdd, 
        {coordinates:{
          x : centerCoordinates.x + pointA.x,
          y : centerCoordinates.y + pointA.y,
      }, idTO: id, touchIdentifier:-1, isPointA: true, isPointB: false, isPointC: false},
        {coordinates:{
          x : centerCoordinates.x + pointB.x,
          y : centerCoordinates.y + pointB.y,
      }, idTO: id, touchIdentifier:-1, isPointA: false, isPointB: true, isPointC: false},
        {coordinates:{
          x : centerCoordinates.x + pointC.x,
          y : centerCoordinates.y + pointC.y,
      }, idTO: id, touchIdentifier:-1, isPointA: false, isPointB: false, isPointC: true}
    ]);
  }
  
  function  handleOnMove(
    id: string,
    centerCoordinates: Coordinates,
    pointA: Coordinates,
    pointB: Coordinates,
    pointC: Coordinates) : void{
      
      let pointChangedIdentifiers : number[] = [];

      //console.log("HandleOnMove", centerCoordinates, pointA, pointB, pointC);

      for(let pointInfos of TOPointInfosList.current){
        if(pointInfos.idTO === id){
          if(pointInfos.isPointA){
            pointInfos.coordinates = {x: centerCoordinates.x + pointA.x, y: centerCoordinates.y + pointA.y};
            pointChangedIdentifiers.push(pointInfos.touchIdentifier);
          }
          else if(pointInfos.isPointB){
            pointInfos.coordinates = {x: centerCoordinates.x + pointB.x, y: centerCoordinates.y + pointB.y};
            pointChangedIdentifiers.push(pointInfos.touchIdentifier);
          }
          else if(pointInfos.isPointC){
            pointInfos.coordinates = {x: centerCoordinates.x + pointC.x, y: centerCoordinates.y + pointC.y};
            pointChangedIdentifiers.push(pointInfos.touchIdentifier);
          }
        }
      }

      sendTouchMove(pointChangedIdentifiers);
  }

  useEffect(() => {

    if(TOPointInfosListToAdd.length === 0){
      return;
    }

    setTimeout(() => {
      if(TOPointInfosListToAdd.length === 0){
        return;
      }
      let pointInfos = TOPointInfosListToAdd[0];
      pointInfos.touchIdentifier = getFirstMissingIdentifier();
      TOPointInfosList.current.push(pointInfos);
      sendTouchStart(pointInfos);
      
      var TOPointInfosListToAddCopy  = [...TOPointInfosListToAdd];
      TOPointInfosListToAddCopy.splice(0, 1);
      setTOPointInfoListToAdd(TOPointInfosListToAddCopy);
    }, 10);


  }, [TOPointInfosListToAdd]);

  useEffect(() => {

    if(TOPointInfosListToRemove.length === 0){
      return;
    }

    setTimeout(() => {
      if(TOPointInfosListToRemove.length === 0){
        return;
      }
      let pointInfos = TOPointInfosListToRemove[0];
      const index = TOPointInfosList.current.indexOf(pointInfos);
  
      if(index >= 0){
        TOPointInfosList.current.splice(index, 1);
        sendTouchEnd(pointInfos);
      }
      
      var TOPointInfosListToRemoveCopy  = [...TOPointInfosListToRemove];
      TOPointInfosListToRemoveCopy.splice(0, 1);
      setTOPointInfoListToRemove(TOPointInfosListToRemoveCopy);
    }, 10);
  }, [TOPointInfosListToRemove]);

  function sendTouchStart(pointInfo : TOPointInfos) : void{

    const inputElement : HTMLElement = document.getElementById('input') as HTMLElement;

    const touches = createCurrentTouchList();

    //console.log(pointInfo);

    simulateTouchEvent(
      inputElement, 
      "touchstart", 
      touches,
      [{
        id:pointInfo.touchIdentifier,
        x:pointInfo.coordinates.x,
        y:pointInfo.coordinates.y
      }]
    )
  }

  function sendTouchMove(pointChangedIdentifiers : number[]) : void{

    const inputElement : HTMLElement = document.getElementById('input') as HTMLElement;

    const touches = createCurrentTouchList();

    let changedTouches : any[] = [];

    //console.log("pointChangedIdentifiers", pointChangedIdentifiers);
    //console.log("touches", touches);


    for(let touch of touches){
      if(pointChangedIdentifiers.includes(touch.id)){
        changedTouches.push(touch);
      }
    }

    //console.log(changedTouches);

    simulateTouchEvent(
      inputElement, 
      "touchmove", 
      touches,
      changedTouches
    )
  }

  function sendTouchEnd(pointInfos : TOPointInfos) : void{

    const inputElement : HTMLElement = document.getElementById('input') as HTMLElement;

    const touches = createCurrentTouchList();

    simulateTouchEvent(
      inputElement, 
      "touchend", 
      touches,
      [{
        id: pointInfos.touchIdentifier,
        x: pointInfos.coordinates.x,
        y: pointInfos.coordinates.y, 
      }]
    )
  }

  function createCurrentTouchList() : any[]{

    let touches : any[] = [];

    for(let pointInfos of TOPointInfosList.current){
      touches.push({
        id: pointInfos.touchIdentifier,
        x: pointInfos.coordinates.x,
        y: pointInfos.coordinates.y,
      });
    }

    return touches;
  }

  function getFirstMissingIdentifier() : number{

    let identifierList : number[] = [];

    for(let pointInfo of TOPointInfosList.current){
      identifierList.push(pointInfo.touchIdentifier);
    }

    let i = startIdentifier;
    while(true){
      if(!(identifierList.includes(i))){
        return i;
      }
      i ++;
    }
  }

  /*
  useEffect(() => {
    const inputElement : HTMLElement = document.getElementById('input') as HTMLElement;

    let touches : any[] = []

    let count = 0;

    //console.log(TOInfosDict);

    for (const key in TOInfosDict){
      const toInfos : TOInfos = TOInfosDict[key];
    
      touches.push(
      {
        id : count * 3,
        x : toInfos.pointA.x + toInfos.coordinates.x,
        y : toInfos.pointA.y + toInfos.coordinates.y
      },
      {
        id : count * 3 + 1,
        x : toInfos.pointB.x + toInfos.coordinates.x,
        y : toInfos.pointB.y + toInfos.coordinates.y
      },
      {
        id : count * 3 + 2,
        x : toInfos.pointC.x + toInfos.coordinates.x,
        y : toInfos.pointC.y + toInfos.coordinates.y
      }
      )

      count ++;
    }

    simulateTouchEvent(
      inputElement, 
      "touchmove", 
      touches,
      [changedDraggableTOInfo]
    );
  }, [TOInfosDict]);
*/
  useEffect(() => {
    let newListDraggableTO = [];

    for(let id in dictDraggableTO){
      newListDraggableTO.push(dictDraggableTO[id]);
    }

    setListDraggableTO(newListDraggableTO)

  }, [dictDraggableTO])
  

  function findTOIdBySimulatorKey(simulatorKey : string) : string | null{
    for(let i = 0; i < tangibleObjectDataList.length; i++){
      let tangibleObjectData = tangibleObjectDataList[i];
      if(tangibleObjectData.simulatorKey && tangibleObjectData.simulatorKey.toLowerCase() === simulatorKey.toLowerCase()){
        return tangibleObjectData.id;
      }
    }

    return null;
  }

  function addOrRemoveDraggableTO(idToAddOrRemove : string){
    
    //Remove
    if(idToAddOrRemove in dictDraggableTO){
      let newDictDraggableTO  = {... dictDraggableTO};
      delete newDictDraggableTO[idToAddOrRemove];
      setDictDraggableTO(newDictDraggableTO);

      let pointInfosToRemoveTempList = [];

      for(let i = 0;  i < TOPointInfosList.current.length; i++){
        const pointInfos = TOPointInfosList.current[i];

        if(pointInfos.idTO === idToAddOrRemove){
          pointInfosToRemoveTempList.push(pointInfos);
        }
      }

      setTOPointInfoListToRemove([
        ...TOPointInfosListToRemove, ...pointInfosToRemoveTempList])
      
      return;
    }

    //Add
    for(let i = 0; i < tangibleObjectDataList.length; i++){
      let tangibleObjectData = tangibleObjectDataList[i];
      if(tangibleObjectData.id === idToAddOrRemove){
        const [distAB, distBC, distCA] = shuffle([tangibleObjectData.distAB, tangibleObjectData.distBC, tangibleObjectData.distCA])

        let newDraggableTO = <DraggableTO
          key={tangibleObjectData.id}
          id={tangibleObjectData.id}
          onStart={handleOnStart}
          onMove={handleOnMove}
          distAB = {distAB}
          distBC = {distBC}
          distCA = {distCA}
          style=
            {{
              height:100,
              width:100,
              zIndex:999,
              position:"absolute",

          }}
          defaultCoordinates={mouseCoord}
          defaultRotation={0}
        />

        setDictDraggableTO({...dictDraggableTO, [idToAddOrRemove]: newDraggableTO});

        return;
      }
    }
  }

    
    return (
      <div id='simulator'
      onKeyDown={(event) => {let idTO= findTOIdBySimulatorKey(event.key); if(idTO !== null){addOrRemoveDraggableTO(idTO)}}} 
      onMouseMove={(event) => {setMouseCoord({x: event.clientX, y: event.clientY})}}>
          <div style={{
            display: "flex",
            flexDirection: "row"
          }}>
            {listDraggableTO}
          </div>
          {children}
      </div>
    );
  /*
    return (
      <DndContext onDragEnd={handleDragEnd}>
        <DraggableMenu/>
        <Droppable>
          {props.children}
        </Droppable>
      </DndContext>
    );
    */
    
  };