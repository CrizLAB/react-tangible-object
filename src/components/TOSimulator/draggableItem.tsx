import React, {useEffect, useRef, useState} from 'react';
import {
  DndContext,
  useDraggable,
  useSensor,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  PointerActivationConstraint,
  Modifiers,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
} from '@dnd-kit/core';

import type {Coordinates} from '@dnd-kit/utilities';

import { calculateTrianglePoints } from './utils';

type CallbackFunctionDraggableTOInfos =
  (
    id: string,
    coordinates: Coordinates, 
    pointA: Coordinates, 
    pointB: Coordinates, 
    pointC: Coordinates,
    ) => void;

interface Props {
    id : string;
    onMove : CallbackFunctionDraggableTOInfos;
    onStart : CallbackFunctionDraggableTOInfos;
    distAB: number;
    distBC: number;
    distCA: number;
    defaultCoordinates?: Coordinates;
    defaultRotation?: number;
    activationConstraint?: PointerActivationConstraint;
    modifiers?: Modifiers;
    style?: React.CSSProperties;
    label?: string;
}

export function DraggableTO({
    id,
    onMove,
    onStart,
    distAB,
    distBC,
    distCA,
    activationConstraint,
    defaultCoordinates,
    defaultRotation,
    modifiers,
    style,
  }: Props) {

    const [{x, y}, setCoordinates] = useState<Coordinates>(defaultCoordinates? defaultCoordinates :  {x: 0, y: 0});
    
    //const [isActivated, setIsActivated] = useState<boolean>(false);
    const [pointA, setPointA] = useState<Coordinates>({x: 0, y: 0});
    const [pointB, setPointB] = useState<Coordinates>({x: 0, y: 0});
    const [pointC, setPointC] = useState<Coordinates>({x: 0, y: 0});
    const [radius, setRadius] = useState<number>(0);
    const [rotation, setRotation] = useState<number>(defaultRotation? defaultRotation : 0);

    const started = useRef<boolean>(false);

    const [offset, setOffset] = useState<number>(0);
    const mouseSensor = useSensor(MouseSensor, {
      activationConstraint,
    });
    const touchSensor = useSensor(TouchSensor, {
      activationConstraint,
    });
    const keyboardSensor = useSensor(KeyboardSensor, {});
    const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

    useEffect(() => {
      setRadius(calculateRadius(pointA, pointB, pointC));
    }, [pointA, pointB, pointC]);

    useEffect(() => {
      setOffset(radius + 7.5);
    }, [radius]);

    function calculateRadius(pointA : Coordinates, pointB : Coordinates, pointC : Coordinates) : number{
      const distA = Math.sqrt(pointA.x**2 + pointA.y**2);
      const distB = Math.sqrt(pointB.x**2 + pointB.y**2);
      const distC = Math.sqrt(pointC.x**2 + pointC.y**2);

      return Math.max(distA, distB, distC);
    }

    useEffect(() => {
      if(rotation > 360 ){
        setRotation(rotation % 360);
      }
      else if(rotation < 0){
        setRotation(rotation + 360)
      }
      else{
        const result = calculateTrianglePoints(distAB, distBC, distCA, rotation);
        //console.log("Result of rotate calculateTrianglePoints : ", result)
        if(result){
          setPointA({x: result.A[0], y: result.A[1]});
          setPointB({x: result.B[0], y: result.B[1]});
          setPointC({x: result.C[0], y: result.C[1]});
        }
      }
    }, [rotation]);

    const onDragEnd = (dragEndEvent : DragEndEvent) => {
      const delta = dragEndEvent.delta;
      
      setCoordinates(({x, y}) => {
          return {
            x: x + delta.x,
            y: y + delta.y,
          };
        }
      );
      }

    const onDragStart = (_ : DragStartEvent) => {
  
    };

    const onDragMove = (dragMoveEvent : DragMoveEvent) => {

      const delta = dragMoveEvent.delta;
      onMove(id, {x: x + delta.x + offset, y: y + delta.y + offset}, pointA, pointB, pointC);
      
    };

    useEffect(() => {
      if(pointA.x === 0 && pointB.x === 0 && pointC.x === 0 && pointA.y === 0 && pointB.y === 0 && pointC.y === 0){
        return;
      }
      onMove(id, {x: x + offset, y: y + offset}, pointA, pointB, pointC);

      
    }, [x, y, pointA, pointB, pointC]);

    useEffect(() => {
      const result = calculateTrianglePoints(distAB, distBC, distCA, rotation);
        //console.log("Result of start calculateTrianglePoints : ", result);
        //console.log(offset);
        if(result && offset > 10 && !started.current){
          onStart(
            id, 
            {x: x + offset, y: y + offset}, 
            {x: result.A[0], y: result.A[1]}, 
            {x: result.B[0], y: result.B[1]}, 
            {x: result.C[0], y: result.C[1]});
            started.current = true;
        }
    }, [offset]);
    
    return (
      <DndContext
        sensors={sensors}
        onDragEnd={onDragEnd} 
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        modifiers={modifiers}
      >
        <DraggableItem
            label={id}
            x={x}
            y={y}
            style={style}
            pointA={pointA}
            pointB={pointB}
            pointC={pointC}
            radius={radius}
            onWheel={(event : WheelEvent) => setRotation(rotation + event.deltaY/10) /*setRotation(rotation + (event.key === 'ArrowUp'? 10 : event.key === 'ArrowDown'? -10 : 0))*/}
            
        />
      </DndContext>
    );
  }

interface DraggableItemProps {
    label: string;
    style?: React.CSSProperties;
    x: number;
    y: number;
    pointA:Coordinates;
    pointB:Coordinates;
    pointC:Coordinates;
    radius:number
    onWheel:Function;
  }

function DraggableItem({
    label,
    style,
    x,
    y,
    pointA,
    pointB,
    pointC,
    radius,
    onWheel,
  }: DraggableItemProps) {

    const {attributes, isDragging, listeners, setNodeRef, transform} =
      useDraggable({
        id: 'draggable',
    });

    if(isDragging){
    }

    return (
      <div
        onWheel={(event) => onWheel(event)}
        ref={setNodeRef}
        style={
            transform ?
            {
                ...style,
                transform: `translate(${transform.x + x}px, ${transform.y + y}px) rotate(${"0deg"})`
            } as React.CSSProperties 
            : {
                ...style,
                transform: `translate(${x}px, ${y}px) rotate(${"0deg"})`
            } as React.CSSProperties
        }

      {...attributes}
      {...listeners}>

        <svg width={`${(radius + 5)*2}`} height={`${(radius + 5)*2}`} xmlns="http://www.w3.org/2000/svg">
          <circle
            cx = {radius + 5}
            cy = {radius + 5}
            r = {radius}
            stroke="black"
            strokeWidth="3"
            fill="red"
            fillOpacity={0.4}
            strokeOpacity={0.4}
          />
          <circle
            cx= {radius + pointA.x + 5}
            cy= {radius + pointA.y + 5}
            r = {5}
            stroke="black"
            strokeWidth="1"
            fill="red"
            fillOpacity={0.4}
            strokeOpacity={0.4}
          />
          <circle
            cx= {radius + pointB.x + 5}
            cy= {radius + pointB.y + 5}
            r = {5}
            stroke="black"
            strokeWidth="1"
            fill="green"
            fillOpacity={0.4}
            strokeOpacity={0.4}
          />
          <circle
            cx= {radius + pointC.x + 5}
            cy= {radius + pointC.y + 5}
            r = {5}
            stroke="black"
            strokeWidth="1"
            fill="blue"
            fillOpacity={0.4}
            strokeOpacity={0.4}
          />

          <text 
            textAnchor="middle" 
            x={ radius + 5 }
            y={ radius + 15 }
            fontSize={28}
            fill='#FFFFFF'
          >
            {`${label.toLocaleUpperCase()}`} 
          </text>
        </svg>
      </div>
    );
  }