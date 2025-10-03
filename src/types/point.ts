export interface Point{ 
    x: number; 
    y: number 
};


export interface PointWithId extends Point {
    id: number
}