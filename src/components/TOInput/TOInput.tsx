import React, {createContext, useRef, useState } from 'react';
import { useTOContext } from '../../hooks';
import { EndEvent, MoveEvent, StartEvent, TangibleObject, TangibleObjectData } from '../../types';
import { TOMonitorContext, useTOMonitorProvider } from '../TOMonitor';
import {Matrix} from 'ts-matrix'

export type TouchHandlingMode = "Standard" | "TOOnly" | "RetainStartEvent"

interface TouchInfo{
  touchIdentifier : number;
  lastTouch : React.Touch;
  touchStart : React.Touch;
  touchStartOnHold : boolean;
  shiftedTouchIdentifier? : number;
  TOId? : string;
}

export interface Props {
  //fichier de config de TO
  children?: React.ReactNode;
  precision : number;
  tangibleObjectDataList : TangibleObjectData[];
  touchHandlingMode? : TouchHandlingMode;
  simulateClicks? : boolean;
  maxDistanceForClick? : number
}

//debug context
export const TouchInfosContext = createContext<Record<number, TouchInfo>>({});

export const TOInput = function TOInput({ children, precision, touchHandlingMode = "Standard", tangibleObjectDataList, simulateClicks = false, maxDistanceForClick = 20}: Props) {
 
  
  const { tangibleObjects, setTangibleObjets } = useTOContext();
  const [
    dispatchMonitorEvent,
    registerMonitorListener,
  ] = useTOMonitorProvider();

  const touchInfos = useRef<Record<number, TouchInfo>>({});

  const [touchInfosState, setTouchInfosState] = useState<Record<number, TouchInfo>>({});
  

  function handleTouchStart(event : React.TouchEvent){

    touchInfos.current[event.changedTouches[0].identifier] = {
      touchIdentifier : event.changedTouches[0].identifier,
      touchStart : event.changedTouches[0],
      lastTouch : event.changedTouches[0],
      touchStartOnHold : false,
    };

    //console.log("Touches on touchStart", event.touches);

    //console.log("TouchStart", tangibleObjects);

    //Check if touch can be added to TO with missing touch
    //From all the TO that miss a touch, find the best candidate
    let minDist = -1;
    let TOFound : TangibleObject | null = null;
    tangibleObjects?.forEach((TO : TangibleObject) => {
      let dist = TO.distanceToMissingTouch(event.changedTouches[0]);
      //console.log(dist);
      //Find a TO that misses a touch and that have a distance to the new touch < precision 
      if(dist > 0 && (dist < minDist || minDist < 0) && dist < precision){
        minDist = dist;
        TOFound = TO;
      }
    });

    let didAddTouch = false;
    if(TOFound != null){
      // If a TO was found with a missing touch, try to add the missing touch to the TO (this should not fail)
      didAddTouch = (TOFound as TangibleObject).tryToSetMissingTouch(event.changedTouches[0]);
       //If a TO was added that way, no need to check anything else
      if(didAddTouch){
        event.stopPropagation();
        touchInfos.current[event.changedTouches[0].identifier].TOId = (TOFound as TangibleObject).id
        return;
      }
    }

    //if the touchHandlingMode is RetainStartEvent
    if(touchHandlingMode === "RetainStartEvent"){

      //the start event is stored is held for 50ms
      //when there are 3 or more start events on hold, 
      //calculations are made to determine is the start events can form a new TO.

      touchInfos.current[event.changedTouches[0].identifier].touchStartOnHold = true;

      //The event is stopped right away because it could be a start event that forms a TO and thus will not be propogated further
      event.stopPropagation();

      //The number of startTouch on hold is stored to check if new startevent will be added between now and in 50 ms
      
      let nbOfStartTouchOnHoldBeforeTimeout = 0;

      for (const [, touchInfo] of Object.entries(touchInfos.current)) {
        if(touchInfo.touchStartOnHold){
          nbOfStartTouchOnHoldBeforeTimeout ++;
        }
      }

      setTimeout(() => {
        //console.log(touchStartEventOnHoldQueue.current);

        //50 ms after 
        //get the list of start touch on hold to see if a new startevent was added in the meantime

        const startTouchesOnHold = [];
        
        for (const [, touchInfo] of Object.entries(touchInfos.current)) {
          if(touchInfo.touchStartOnHold){
            startTouchesOnHold.push(touchInfo.touchStart);
          }
        }

        if(startTouchesOnHold.length > nbOfStartTouchOnHoldBeforeTimeout){ //if(touchInfos.current.length > nbOfStartTouchOnHold){ 
          //calculation are made to see if the touches in the queue can form a new TO

          let didCreateTO = createTOIfPossible(startTouchesOnHold);

          //if a TO was created, stop holding events
          //TODO : stop holding only the events that were used to create the TO

          if(didCreateTO){
            for (const [, touchInfo] of Object.entries(touchInfos.current)) {
              if(touchInfo.touchStartOnHold){
                touchInfo.touchStartOnHold = false;
              }
            }
          }
          
          //if no TO was created
          else{
            //propogate the event and stop holding it
            touchInfos.current[event.changedTouches[0].identifier].touchStartOnHold = false;
            touchInfos.current[event.changedTouches[0].identifier].shiftedTouchIdentifier = findNextShiftedTouchIdentifier();
            propagateTouchEvent("touchstart", [event.changedTouches[0].identifier], event.target);
          }
        }
        //if no start event was added in 50ms, propogate the event and strop holding it
        else{
          touchInfos.current[event.changedTouches[0].identifier].touchStartOnHold = false;
          touchInfos.current[event.changedTouches[0].identifier].shiftedTouchIdentifier = findNextShiftedTouchIdentifier();
          propagateTouchEvent("touchstart", [event.changedTouches[0].identifier], event.target);
        }
      }, 50);
    }

    //if the touchHandlingMode is anything but RetainStartEvent
    else{

      //List all the start touches that don't already belong to a TO
      let touchesToEvaluate : React.Touch[] = []

      for (const [, touchInfo] of Object.entries(touchInfos.current)) {
        if(!touchInfo.TOId){
          touchesToEvaluate.push(touchInfo.touchStart);
        }
      }

      //Try to create a TO with those
      let didCreateTO = createTOIfPossible(
        touchesToEvaluate
      );

      //If a TO was created do not propogate the event
      if(didCreateTO){
        event.stopPropagation();
      }

      //else if there is no TO, let the event propagate normaly 
      else if (!tangibleObjects || tangibleObjects.length === 0){
        touchInfos.current[event.changedTouches[0].identifier].shiftedTouchIdentifier = findNextShiftedTouchIdentifier();
        return;
      }

      //else propagateTouchEvent if not in TOOnly mode but remove all the touch ids that belong to TO
      else{
        event.stopPropagation();
        if(touchHandlingMode !== "TOOnly"){
          touchInfos.current[event.changedTouches[0].identifier].shiftedTouchIdentifier = findNextShiftedTouchIdentifier();
          propagateTouchEvent("touchstart", [event.changedTouches[0].identifier], event.target);
        }
      }
    }
  }

  function handleTouchMove(event : React.TouchEvent){

    // Has to be quick to not delay the touches


    for(let i = 0; i < event.changedTouches.length; i++){
      //storing the last touches
      touchInfos.current[event.changedTouches[i].identifier].lastTouch = event.changedTouches[i];
    }
    
    
    // If there are no TO, do nothing to the touchmove event

    if(!tangibleObjects || tangibleObjects.length === 0){
      return;
    }

    // List that stores all the changed touches identifiers that are not part of a TO
    let changedTouchesIdentifiersNotBelongingToTO : number[] = [];

    // List that stores all the TO that will move thanks to the touchmove event
    let tangibleObjectsToMove : TangibleObject[] = [];

    // Looping though every changed touch i.e. every touch that moved in the touchmove event
    // This is less efficient than looping though every TO first and then every changed touch, but 
    // it is needed to go though every changed touch to find out which are not part of a TO
    // so ultimatly it is faster to do it that way
    for(let i = 0; i < event.changedTouches.length; i++){

      //only check the touches that have not been associated with a TO
      if(touchInfos.current[event.changedTouches[i].identifier].TOId === undefined){
        //changedTouchesNotBelongingToTO.push(event.changedTouches[i])
        changedTouchesIdentifiersNotBelongingToTO.push(event.changedTouches[i].identifier);
        continue;
      }
      
      //Looping though every TO to see if the touch is part of a TO
      for(let TO of tangibleObjects){
        if(TO.touchA && TO.touchA.identifier === event.changedTouches[i].identifier){
          //If so, update the pos of the touch in the TO
          TO.setTouchA(event.changedTouches[i]);

          //And store the TO in tangibleObjectsToMove because it has moved
          if(!tangibleObjectsToMove.includes(TO)){
            tangibleObjectsToMove.push(TO);
          }
          
          
          continue;
        }
        //Same for touchB
        else if(TO.touchB && TO.touchB.identifier === event.changedTouches[i].identifier){
          TO.setTouchB(event.changedTouches[i]);
          if(!tangibleObjectsToMove.includes(TO)){
            tangibleObjectsToMove.push(TO);
          }
          
          continue;
        }

        //Same for touchC
        else if(TO.touchC && TO.touchC.identifier === event.changedTouches[i].identifier){
          TO.setTouchC(event.changedTouches[i]);
          if(!tangibleObjectsToMove.includes(TO)){
            tangibleObjectsToMove.push(TO);
          }
          
          continue;
        }
      }
      
      //If the touch is not part of a TO, put it in the changedTouchesNotBelongingToTO
      //The touch is also converted to a non React Touch in order to be accepted by the dispatchEvent method.
      //The identifier of the touch is also shifted to ignore the touch identifiers that belong to a TO
      //For example :
      //If the touch identifier received were [0, 1, 2, 3] and the touches 0, 1, 2 all belong to a TO, the identifiers
      //that the target compotent recieves are just [0]. The touch 3 is shifted to ignore the touch 0, 1, 2
    }


    //Send the TOMoveEvent to the child for each TO that had a touch that moved
    tangibleObjectsToMove.forEach((TO) => {
      const TOMoveEvent: MoveEvent = {
        idTO: TO.id,
        barycentre: TO.triangle.barycentre,
        angle: TO.angle,
        radius: TO.radius
      };
      dispatchMonitorEvent({ type: 'onTOMove', event: TOMoveEvent });
    });

    //Update tangibleObjects if at least on TO moved
    if(tangibleObjectsToMove.length > 0){
      setTangibleObjets([... tangibleObjects]);
    }

    //stop the propagation because there is a least one TO in tangibleObjects so the touch identifiers need to be shifted
    event.stopPropagation();

    //if TOOnly mode no need to propagate new touch events
    if(touchHandlingMode === "TOOnly"){
      return;
    }

    if(changedTouchesIdentifiersNotBelongingToTO.length === 0){
      return;
    }

    propagateTouchEvent("touchmove", changedTouchesIdentifiersNotBelongingToTO, event.target);

    return;

  }

  function handleTouchEnd(event : React.TouchEvent){

    //Check if touch is in existing TO, if TO has 3 touches, remove correspoding TO and prevent event and store the distance of the missing touch,
    //If TO has 2 touches. Remove TO with only one touch. and prevent event

    //console.log("Changed touches on touchEnd", event.changedTouches);

    //console.log("TouchEnd", tangibleObjects);


    // List that stores all the changed touches identifiers that are not part of a TO
    let changedTouchesIdentifiersNotBelongingToTO : number[] = [];
    
    let tangibleObjectsToRemove : TangibleObject[] = [];
    let tangibleObjectsChanged : boolean = false;

    // Looping though every changed touch i.e. every touch that were ended in the touchend event
    
    for(let i = 0; i < event.changedTouches.length; i++){

      //only check the touches that have not been associated with a TO
      if(touchInfos.current[event.changedTouches[i].identifier].TOId === undefined){
        //changedTouchesNotBelongingToTO.push(event.changedTouches[i])
        changedTouchesIdentifiersNotBelongingToTO.push(event.changedTouches[i].identifier);
        let correspondingTouchStart = touchInfos.current[event.changedTouches[i].identifier].touchStart;
        let touchStartOnHold = touchInfos.current[event.changedTouches[i].identifier].touchStartOnHold;

        if(touchStartOnHold){
          propagateTouchEvent("touchStart", [event.changedTouches[i].identifier], correspondingTouchStart.target);
        }
        
        if(simulateClicks){
          let produceClick = touchStartAndTouchEndProduceClick(correspondingTouchStart, event.changedTouches[i]);
          if(produceClick){
            console.log("Click on ", event.target);
            let clickEvent = new MouseEvent("click" , {
              bubbles: true,
              cancelable: true,
              view: window,
            });
            event.target.dispatchEvent(clickEvent);
          }
        }

      }

      delete touchInfos.current[event.changedTouches[i].identifier];
      //console.log("Deleting touch info with identifier", event.changedTouches[i].identifier);
      

      if(!tangibleObjects){
        continue;
      }

      for(let TO of tangibleObjects){
        //if the identifier corresponds to the touchA of the TO
        if(TO.touchA && TO.touchA.identifier === event.changedTouches[i].identifier){
          //set it to null
          TO.setTouchA(null);

          //if the TO has more that one missing touch, add it to the list of TO to remove
          if(TO.numberOfMissingTouch() > 1 && !tangibleObjectsToRemove.includes(TO)){
            tangibleObjectsToRemove.push(TO);
          }
          tangibleObjectsChanged = true;
          
          continue;
        }
        //same for touch B
        else if(TO.touchB && TO.touchB.identifier === event.changedTouches[i].identifier){
          TO.setTouchB(null);
          if(TO.numberOfMissingTouch() > 1 && !tangibleObjectsToRemove.includes(TO)){
            tangibleObjectsToRemove.push(TO);
          }
          tangibleObjectsChanged = true;
          
          continue;
        }

        //same for touch C
        else if(TO.touchC && TO.touchC.identifier === event.changedTouches[i].identifier){
          TO.setTouchC(null);
          if(TO.numberOfMissingTouch() > 1 && !tangibleObjectsToRemove.includes(TO)){
            tangibleObjectsToRemove.push(TO);
          }
          tangibleObjectsChanged = true;
          
          continue;
        }
      }
    }

    //if there are no tangibleObjects do nothing
    if(!tangibleObjects || tangibleObjects.length === 0){
      return;
    }

    //Update tangibleObjects and send events 
    if(tangibleObjectsChanged){
      let newTangibleObjects = [...tangibleObjects];

      for(let TO of tangibleObjectsToRemove){
        const index = newTangibleObjects.indexOf(TO, 0);
        if (index > -1) {
          newTangibleObjects.splice(index, 1);
          const TOEndEvent: EndEvent = {
            idTO: TO.id,
            barycentre: TO.triangle.barycentre,
            angle: TO.angle,
            radius: TO.radius
          };
          dispatchMonitorEvent({ type: 'onTOEnd', event: TOEndEvent});
        }
      }
      setTangibleObjets([...newTangibleObjects]);
    }

    //stop the propagation because there is a least one TO in tangibleObjects so the touch identifiers need to be shifted
    event.stopPropagation();

    //if TOOnly mode no need to propagate new touch events 
    if(touchHandlingMode === 'TOOnly'){
      return;
    }


    propagateTouchEvent("touchend", changedTouchesIdentifiersNotBelongingToTO, event.target);

    /*
    //get all the touches not belonging to a TO
    let touchesNotBelongingToTO : Touch[] = [];
    for(let i = 0; i < event.touches.length; i ++ ){
      let touch = event.touches.item(i);
      if(touch != undefined && !touchIdentifiersBelongingtoTO.current.includes(touch.identifier)){
        touchesNotBelongingToTO.push(convertReactTouchToNativeTouch(touch, touchesNotBelongingToTO.length));
      }
    }

    
    //If there are at least one touch not belonging to TO 
    if(changedTouchesNotBelongingToTO.length > 0 || touchesNotBelongingToTO.length > 0){
      
      //console.log("handleTouchEnd changedTouchesNotBelongingToTO", changedTouchesNotBelongingToTO);
      //console.log("handleTouchEnd touchesNotBelongingToTO", touchesNotBelongingToTO);

      //if there are touch event on hold release them before sending the touchend event
      if(touchStartEventOnHoldQueue.current.length > 0){
        console.log("Sending start in handleTouchEnd");
        let startEvent = touchStartEventOnHoldQueue.current[0];
        touchStartEventOnHoldQueue.current.splice(0, 1);
        propagateTouchEvent("touchstart", startEvent);
        if(simulateClicks && touchStartAndTouchEndProduceClick(startEvent.changedTouches[0] , event.changedTouches[0])){
          console.log("Click on ", event.target);
          let clickEvent = new MouseEvent("click" , {
            bubbles: true,
            cancelable: true,            
            view: window,
          });

          event.target.dispatchEvent(clickEvent);
          stopTheNextTrustedClickEvent.current = true;
        }
      }
  
      event.target?.dispatchEvent(new TouchEvent("touchend", {
        touches: touchesNotBelongingToTO,
        targetTouches : touchesNotBelongingToTO,
        view: window,
        cancelable: true,
        bubbles: true,
        changedTouches : changedTouchesNotBelongingToTO
      }));

      //console.log("touchesToCheckForClicks", touchesToCheckForClicks.current);

      //check for every touch start that do not belong to a to for click
      if(simulateClicks){
        for(let i = 0; i < changedTouchesNotBelongingToTOWithOriginalIdentifiers.length; i ++ ){
          let touchToRemoveIndex = -1;
          for(let j = 0; j < touchesToCheckForClicks.current.length; j++){
            if(touchStartAndTouchEndProduceClick(touchesToCheckForClicks.current[j] , changedTouchesNotBelongingToTOWithOriginalIdentifiers[i])){
              console.log("Click on ", event.target);
              let clickEvent = new MouseEvent("click" , {
                bubbles: true,
                cancelable: true,
                view: window,
              });
  
              event.target.dispatchEvent(clickEvent);
            }
  
            if(changedTouchesNotBelongingToTOWithOriginalIdentifiers[i].identifier === touchesToCheckForClicks.current[j].identifier){
              touchToRemoveIndex = j;
              break;
            }
          }
  
          if(touchToRemoveIndex >= 0){
            touchesToCheckForClicks.current.splice(touchToRemoveIndex, 1);
          }
        }
      }
    }

    else{
      if(touchStartEventOnHoldQueue.current.length > 0){
        
        //console.log("Sending start in handleTouchEnd");
        let startEvent = touchStartEventOnHoldQueue.current[0];
        touchStartEventOnHoldQueue.current.splice(0, 1);
        propagateTouchEvent("touchstart", startEvent);
        propagateTouchEvent("touchend", event);
        if(simulateClicks && touchStartAndTouchEndProduceClick(startEvent.changedTouches[0] , event.changedTouches[0])){
          console.log("Click on ", event.target);
          let clickEvent = new MouseEvent("click" , {
            bubbles: true,
            cancelable: true,
            view: window,
          });

          event.target.dispatchEvent(clickEvent);
          stopTheNextTrustedClickEvent.current = true;
        }
      }
    }

    if(touchesToCheckForClicks.current.length > 0){
      touchesToCheckForClicks.current = [];
    }
      */
  }

  /*
  useEffect(() => {

    touchIdentifiersBelongingtoTO.current = [];

    tangibleObjects?.forEach((TO) => {
      if(TO.touchA){
        touchIdentifiersBelongingtoTO.current?.push(TO.touchA.identifier);
      }
      if(TO.touchB ){
        touchIdentifiersBelongingtoTO.current?.push(TO.touchB.identifier);
      }
      if(TO.touchC){
        touchIdentifiersBelongingtoTO.current?.push(TO.touchC.identifier);
      }
    });

  }, [tangibleObjects]);
  */

  function touchStartAndTouchEndProduceClick(touchStart : React.Touch, touchEnd : React.Touch) : boolean{
    //console.log("Testing for click : ", touchStart, touchEnd);
    if(touchStart.identifier !== touchEnd.identifier){
      return false;
    }

    if(((touchStart.pageX - touchEnd.pageX)**2 + (touchStart.pageY - touchStart.pageY)**2) > maxDistanceForClick **2){
      return false;
    }

    return true;

  }

  function findNextShiftedTouchIdentifier() : number{

    let identifier = 0;

    const shiftedIdentifiers = [];

    for (const [, touchInfo] of Object.entries(touchInfos.current)) {
      if(touchInfo.shiftedTouchIdentifier !== undefined && touchInfo.TOId === undefined){
        shiftedIdentifiers.push(touchInfo.shiftedTouchIdentifier);
      }
    }

    while (shiftedIdentifiers.includes(identifier)) {
      identifier ++;
    }

    return identifier;
    
  }


  
  function createTOIfPossible(touchesToEvaluate : React.Touch[]) : boolean{

    //console.log(currentTouchList, touchesToEvaluate);

    const distanceMatrix = buildDistanceMatrixWithNewTouch(touchesToEvaluate);

    if(!distanceMatrix){
      return false;
    }

    let minDistance = Number.MAX_VALUE;
    let tangibleObjectDataWithMinDistance : TangibleObjectData | null = null;
    let matchMatrixWithMinDistance : number[][][] | null = null;

    for(let TOData of tangibleObjectDataList){
      let result = isPatternInMatrix(
        distanceMatrix,
        new Matrix(
          3, 3, 
          [
            [0,             TOData.distAB,  TOData.distCA ], 
            [TOData.distAB, 0,              TOData.distBC ], 
            [TOData.distCA, TOData.distBC,  0             ]
          ]
        ), precision);

      if(!result){
        continue;
      }

      let [distance, matchMatrix] = result;

      if(distance > precision){
        continue;
      }

      console.log(TOData.id, "found with distance ", distance);

      if(distance < minDistance){
        minDistance = distance;
        tangibleObjectDataWithMinDistance = {
          id : TOData.id,
          distAB : TOData.distAB,
          distBC : TOData.distBC,
          distCA : TOData.distCA,
        };
        matchMatrixWithMinDistance = [... matchMatrix];
      }
    }

    if(!tangibleObjectDataWithMinDistance || !matchMatrixWithMinDistance){
      return false;
    }
      
    const newTO = createTOAccordingToMatchMatrix( 
      tangibleObjectDataWithMinDistance.id,
      matchMatrixWithMinDistance, 
      tangibleObjectDataWithMinDistance.distAB, 
      tangibleObjectDataWithMinDistance.distBC, 
      tangibleObjectDataWithMinDistance.distCA);

    
    if(!newTO){
      return false;
    }

    touchesToEvaluate.forEach((touch) => {
      //maybe not all touchesToEvaluate
      touchInfos.current[touch.identifier].TOId = newTO.id;
      touchInfos.current[touch.identifier].shiftedTouchIdentifier = undefined;
    });

    if(tangibleObjects){
      setTangibleObjets([...tangibleObjects, newTO]);
    }
    else{
      setTangibleObjets([newTO]);
    }

    const TOStartEvent: StartEvent = {
      idTO: tangibleObjectDataWithMinDistance.id,
      barycentre: newTO.triangle.barycentre,
      angle: newTO.angle,
      radius: newTO.radius
    };
    dispatchMonitorEvent({ type: 'onTOStart', event: TOStartEvent });
    return true;
      
    
  }

  function buildDistanceMatrixWithNewTouch(touchesToEvaluate : React.Touch[]) : Matrix | null{

    /*
    console.log(currentTouchList, newTouch);

    let identifierInTOList : number[] = []
    tangibleObjects!.forEach(
      (TO) => {
        if(TO.touchA){
          identifierInTOList.push(TO.touchA.identifier);
        }
        if(TO.touchB){
          identifierInTOList.push(TO.touchB.identifier);
        }
        if(TO.touchC){
          identifierInTOList.push(TO.touchC.identifier);
        }
      }
    )

    let touchesToEvaluate : React.Touch[] = [newTouch];
    

    for(let i = 0; i < currentTouchList.length; i++){
      if(!identifierInTOList.includes(currentTouchList[i].identifier)){
        touchesToEvaluate.push(currentTouchList[i]);
      }
    }
    */

    if(touchesToEvaluate.length < 3){
      return null;
    }

    let values : number[][] = [];

    let maxIdentifier = touchesToEvaluate[0].identifier;
    for(let i = 1; i < touchesToEvaluate.length; i++){
      if(touchesToEvaluate[i].identifier > maxIdentifier){
        maxIdentifier = touchesToEvaluate[i].identifier;
      }
    }

    for(let i = 0; i < maxIdentifier + 1; i++){
      values[i] = [];
      for(let j = 0; j < maxIdentifier + 1; j++){
        values[i][j] = -1000;
      }
    }

    for(let i = 0; i < touchesToEvaluate.length; i++){
      const touch1 = touchesToEvaluate[i];
      for(let j = 0; j < touchesToEvaluate.length; j++){
        const touch2 = touchesToEvaluate[j];
        if(j === i){
          values[touch1.identifier][touch2.identifier] = 0;
        }
        values[touch1.identifier][touch2.identifier] = Math.sqrt((touch1.clientX - touch2.clientX)**2 + (touch1.clientY - touch2.clientY)**2);
      }
    }

    //console.log(values);

    return new Matrix(maxIdentifier + 1, maxIdentifier + 1, values);
  }

  

  //propagate a TouchEvent with the list TouchIdentifiers that changed during the event but remove all the touch ids that belong to TO.
  //the touches are send with their ids shifted such as the target sees the touchs as there were no tangible object on the table
  function propagateTouchEvent(touchType: string, changedTouchIdentifiers : number[], target : EventTarget){
    let touches : Touch[] = [];
    let changedTouches : Touch[] = [];
    let targetTouches : Touch[] = [];

    for (const [, touchInfo] of Object.entries(touchInfos.current)) {

      //only propagate touches that do not belong to TO i.e touches with shiftedTouchIdentifier
      if(touchInfo.TOId !== undefined || touchInfo.shiftedTouchIdentifier === undefined){
        continue;
      }

      //create touch with shifted identifiers 
      const touch = new Touch({
        identifier : touchInfo.shiftedTouchIdentifier,
        target,
        clientX : touchInfo.lastTouch.clientX,
        clientY : touchInfo.lastTouch.clientY,
        pageX : touchInfo.lastTouch.pageX,
        pageY : touchInfo.lastTouch.pageY,
        screenX : touchInfo.lastTouch.screenX,
        screenY : touchInfo.lastTouch.screenY,
      });

      touches.push(touch);
      
      if(changedTouchIdentifiers.includes(touchInfo.touchIdentifier)){
        changedTouches.push(touch);
        targetTouches.push(touch);
      }
      
    }
    
    target.dispatchEvent(new TouchEvent(touchType, {
      touches,
      targetTouches,
      view: window,
      cancelable: true,
      bubbles: true,
      changedTouches
    }));
  }
    

  function isPatternInMatrix(distanceMatrix : Matrix, patternMatrix : Matrix, eps : number = 0.1) : void | [number, number[][][]]{

    //console.log("Recherche de ", patternMatrix);
    //console.log("dans ", distanceMatrix);

    let matchMatrix : number[][][] = [];

    let totalDistance = 0;

    if(!distanceMatrix){
      return;
    }

    if(patternMatrix.columns === 0 || patternMatrix.rows === 0){
      return;
    }

    let patternWasFound = true;
    
    //On parcourt toutes les colonnes de la petite matrice
    for(let i1 = 0; i1 < patternMatrix.columns; i1++){
      let columnWasFound = true;
      let columnMinDif = Number.MAX_VALUE;
      
      //On crée une liste qui va contenir les matchs de la colonne et qui va les stocker dans la matchingMatrix seulement
      //si on trouve la colonne

      let tempColumnMatchingMatrix = [];
      let tempColumnMatchingMatrixWithMinDif = null;

      //On parcourt toutes les colonnes de la grande matrice
      //On les compare toutes entre elles
      for(let i2 = 0; i2 < distanceMatrix.columns; i2 ++){
        columnWasFound = true;
        let columnTotalDif = 0;

        //Pour cela on  parcourt toutes les cases de la colonne de la petite matrice
        for(let j1 = 0; j1 < patternMatrix.rows; j1 ++){
          //et on les compare avec toutes les cases de la colonne de la grande matrice
          let valueWasFound = false;
          let minDif = Number.MAX_VALUE;
          let rowWithMinDif = 0;
          //console.log(`Recherche de ${patternMatrix.at(i1, j1)} en ${i1}, ${j1} dans la colonne ${i2} de la grande matrice`);
          for(let j2 = 0; j2 < distanceMatrix.rows; j2 ++){
            
            // Si la case de la petite matrice match avec une de celle de la grande matrice on continue la recherche dans cette
            // colonne de la grande matrice
            let dif = Math.abs(patternMatrix.at(i1, j1) - distanceMatrix.at(i2, j2));
            if(dif < eps){
              if(dif < minDif){
                minDif = dif;
                rowWithMinDif = j2;
              }
              //On note le match dans la tempColumnMatchingMatrix
              //console.log(`La valeur ${patternMatrix.at(i1, j1)} en ${i1}, ${j1} de la patternMatrix a été trouvée dans la colonne ${i2} de la grande matrice avec une dif de ${dif}`);
              
              valueWasFound = true;
            }
          }
          if(!valueWasFound){
            //Si aucune value dans la colonne de la grande matrice n'a été trouvée, on peut exclure cette colonne
            //console.log(`La valeur ${patternMatrix.at(i1, j1)} en ${i1}, ${j1} de la patternMatrix n'a pas été trouvée dans la colonne ${i2} de la grande matrice`);
            columnWasFound = false;
            // On passe à la prochaine colonne de la grande matrice à checker
            break;
          }
          else{
            tempColumnMatchingMatrix[j1] = [i2, rowWithMinDif];
            columnTotalDif += minDif;
          }
        }

        //Si la colonne de la petite a été trouvé on arrete les recherches dans la grande et on stocke la tempColumnMatchingMatrix
        // dans la matchMatrix finale

        
        if(columnWasFound){
          if(columnTotalDif < columnMinDif){
            columnMinDif = columnTotalDif;
            tempColumnMatchingMatrixWithMinDif = tempColumnMatchingMatrix;
          }

          //console.log(`La colonne ${i1} de la patternMatrix a été trouvée dans la colonne ${i2} de la grande matrice avec une dif de ${columnTotalDif}`);
          
        }
      }
      
      //Si la colonne de la petite n'a jamais été trouvé dans la grande, on arrete les recherches et le pattern n'est pas trouvé.
      if(!columnWasFound){
        //console.log(`La colonne ${i1} de la patternMatrix n'a pas été trouvée`);
        patternWasFound = false;
        break
      }
      else{
        if(tempColumnMatchingMatrixWithMinDif != null){
          matchMatrix[i1] = tempColumnMatchingMatrixWithMinDif;
          totalDistance += columnMinDif;
        }
      }

    }

    //TODO: Verifier la matchMatrix
    //console.log(matchMatrix);

    if(!patternWasFound){
      //console.log(`Le pattern n'a pas été trouvée`);
      return;
    }

    return [totalDistance, matchMatrix];
  }

  function createTOAccordingToMatchMatrix(id: string, matchMatrix : number[][][], realDistAB : number, realDistBC : number, realDistCA : number) : void | TangibleObject{

    //console.log(currentTouchList);

    if(matchMatrix.length === 0){
      return;
    }

    if(matchMatrix[0].length === 0){
      return;
    }

    if(matchMatrix.length !== 3){
      return;
    }

    if(matchMatrix[0].length !== 3){
      return;
    }

    for(let i = 0; i < matchMatrix.length; i++ ){
      //console.log(matchMatrix[i][0][1], "!==", matchMatrix[i][1][1], "&&", matchMatrix[i][1][1], "!==", matchMatrix[i][2][1], "&&", matchMatrix[i][2][1], "!==", matchMatrix[i][0][1]);
      if(matchMatrix[i][0][1] !== matchMatrix[i][1][1] && matchMatrix[i][1][1] !== matchMatrix[i][2][1] && matchMatrix[i][2][1] !== matchMatrix[i][0][1]){
        const touchA = touchInfos.current[matchMatrix[i][0][1]].touchStart;
        const touchB = touchInfos.current[matchMatrix[i][1][1]].touchStart;
        const touchC = touchInfos.current[matchMatrix[i][2][1]].touchStart;
        
        //console.log(touchA, touchB, touchC);

        if(touchA !== null && touchB != null && touchC != null){
          return new TangibleObject(id, touchA, touchB, touchC, realDistAB, realDistBC, realDistCA);
        }
      }
    }
  }
  
  
  return (
    <TouchInfosContext.Provider value={touchInfosState}>
      <TOMonitorContext.Provider value={registerMonitorListener}>
        <div
          id="input"
          onTouchStartCapture={(event: React.TouchEvent<Element>) => {/*console.log(event);*/ if(event.isTrusted || event.altKey){ handleTouchStart(event); setTouchInfosState({...touchInfos.current});} else{/*console.log("altKey true", event)*/}}}
          onTouchMoveCapture={(event: React.TouchEvent<Element>) => {/*console.log(event);*/ if(event.isTrusted|| event.altKey){handleTouchMove(event); setTouchInfosState({...touchInfos.current})} else{/*console.log("altKey true", event)*/}}}
          onTouchEndCapture={(event: React.TouchEvent<Element>) => {/*console.log(event);*/ if(event.isTrusted|| event.altKey){ handleTouchEnd(event); setTouchInfosState({...touchInfos.current})} else{/*console.log("altKey true", event)*/}}}        

          //onTouchStart={(event) => console.log(event)}
          //onTouchMove={(event) => console.log(event)}
          //onTouchEnd={(event) => console.log(event)}
        >
          {children}
        </div>
      </TOMonitorContext.Provider>
    </TouchInfosContext.Provider>
  );
};

