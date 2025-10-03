
import { Triangle } from "./triangle";


export interface TangibleObjectData{
  id : string;
  simulatorKey? : string;
  distAB : number;
  distBC : number;
  distCA : number;
}

export class TangibleObject {
  public id: string;
  public touchA: React.Touch | null;
  public touchB: React.Touch | null;
  public touchC: React.Touch | null;
  public realDistAB: number;
  public realDistBC: number;
  public realDistCA: number;
  public angle: number;
  public triangle: Triangle;
  public radius : number; //in degrees
  angleA : number; //in radians
  angleB : number; //in radians
  angleC : number; //in radians
  
  //the three points are required to init a tangible object 
  constructor(
    id:string,
    touchA: React.Touch,
    touchB: React.Touch,
    touchC: React.Touch,
    realDistAB: number,
    realDistBC: number,
    realDistCA: number) {
    this.id = id;

    this.touchA = touchA;
    this.touchB = touchB;
    this.touchC = touchC;

    this.realDistAB = realDistAB;
    this.realDistBC = realDistBC;
    this.realDistCA = realDistCA;

    this.angleA = Math.acos((realDistCA * realDistCA + realDistAB * realDistAB - realDistBC * realDistBC) / (2 * realDistCA * realDistAB));
    this.angleB = Math.acos((realDistBC * realDistBC + realDistAB * realDistAB - realDistCA * realDistCA) / (2 * realDistBC * realDistAB));
    this.angleC = Math.acos((realDistBC * realDistBC + realDistCA * realDistCA - realDistAB * realDistAB) / (2 * realDistBC * realDistCA));
    
    this.triangle = new Triangle(
      {x: touchA.clientX, y: touchA.clientY}, 
      {x: touchB.clientX, y: touchB.clientY}, 
      {x: touchC.clientX, y: touchC.clientY})

    this.angle = this.calculateAngle();
    this.radius = this.calculateRadius();

  }

  public positionAndRotationDifference(to : TangibleObject) : {posDif : number, rotDif : number}{
    
    const posDif = Math.sqrt((to.triangle.barycentre.x - this.triangle.barycentre.x) ** 2 + (to.triangle.barycentre.y - this.triangle.barycentre.y) ** 2 )
    const rotDif = this.angle - to.angle;

    return {posDif, rotDif}
  }

  updateTriangle(){
    if(this.numberOfMissingTouch() === 0){
      this.triangle.updateFromABC(
        {x: this.touchA!.clientX, y: this.touchA!.clientY}, 
        {x: this.touchB!.clientX, y: this.touchB!.clientY}, 
        {x: this.touchC!.clientX, y: this.touchC!.clientY})
    }
    else if(this.numberOfMissingTouch() === 1){
      if(!this.touchA){
        this.triangle.updateFromBC(
          {x: this.touchB!.clientX, y: this.touchB!.clientY}, 
          {x: this.touchC!.clientX, y: this.touchC!.clientY},
          this.angleB
        )
      }
      else if(!this.touchB){
        this.triangle.updateFromCA(
          {x: this.touchC!.clientX, y: this.touchC!.clientY}, 
          {x: this.touchA!.clientX, y: this.touchA!.clientY},
          this.angleC
        )
      }
      else if(!this.touchC){
        this.triangle.updateFromAB(
          {x: this.touchA!.clientX, y: this.touchA!.clientY}, 
          {x: this.touchB!.clientX, y: this.touchB!.clientY},
          this.angleA
        )
      }
    }
  }

  public numberOfMissingTouch() : number{
    let toReturn = 0;
    if(!this.touchA){
      toReturn ++;
    }
    if(!this.touchB){
      toReturn ++;
    }
    if(!this.touchC){
      toReturn ++;
    }
    return toReturn;
  }

  public setTouchA(
    touchA: React.Touch | null){
    this.touchA = touchA;

    this.updateTriangle();
    
    this.angle = this.calculateAngle();
  }

  public setTouchB(
    touchB: React.Touch | null){
    this.touchB = touchB;

    this.updateTriangle();
    
    this.angle = this.calculateAngle();
  }

  public setTouchC(
    touchC: React.Touch | null){
    this.touchC = touchC;

    this.updateTriangle();
    
    this.angle = this.calculateAngle();
  }

  calculateAngle(): number{
    return Math.atan2(this.triangle.B.y - this.triangle.A.y, this.triangle.B.x - this.triangle.A.x) * 180 / Math.PI + 180;
  }

  calculateRadius() : number{
    const distA = Math.sqrt((this.triangle.A.x - this.triangle.barycentre.x)**2 + (this.triangle.A.y - this.triangle.barycentre.y)**2);
    const distB = Math.sqrt((this.triangle.B.x - this.triangle.barycentre.x)**2 + (this.triangle.B.y - this.triangle.barycentre.y)**2);
    const distC = Math.sqrt((this.triangle.C.x - this.triangle.barycentre.x)**2 + (this.triangle.C.y - this.triangle.barycentre.y)**2);

    return Math.max(distA, distB, distC);
  }


  distanceToMissingTouch(touch : React.Touch) : number{
    if(this.numberOfMissingTouch() > 1){
      return -1;
    }
    if(!this.touchA){
      //Check distance from B and C
      return Math.abs(Math.sqrt((this.touchB!.clientX - touch.clientX)**2 + (this.touchB!.clientY - touch.clientY)**2) - this.realDistAB) 
        + Math.abs(Math.sqrt((this.touchC!.clientX - touch.clientX)**2 + (this.touchC!.clientY - touch.clientY)**2) - this.realDistCA);
    }
    if(!this.touchB){
      //Check distance from A and C
      return Math.abs(Math.sqrt((this.touchC!.clientX - touch.clientX)**2 + (this.touchC!.clientY - touch.clientY)**2) - this.realDistCA) 
        + Math.abs(Math.sqrt((this.touchA!.clientX - touch.clientX)**2 + (this.touchA!.clientY - touch.clientY)**2) - this.realDistAB);
    }
    if(!this.touchC){
      //Check distance from A and B
      return Math.abs(Math.sqrt((this.touchA!.clientX - touch.clientX)**2 + (this.touchA!.clientY - touch.clientY)**2) - this.realDistCA) 
        + Math.abs(Math.sqrt((this.touchB!.clientX - touch.clientX)**2 + (this.touchB!.clientY - touch.clientY)**2) - this.realDistBC);
    }

    return -1;
  }

  tryToSetMissingTouch(touch : React.Touch) : boolean{
    if(!this.touchA){
      this.touchA = touch;
      return true;
    }
    if(!this.touchB){
      this.touchB = touch;
      return true;
    }
    if(!this.touchC){
      this.touchC = touch;
      return true;
    }

    return false;
  }
}