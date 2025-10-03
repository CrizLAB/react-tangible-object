import {create} from "zustand";
import { TangibleObjectData } from '../types';



type TangibleObjectDataState = {
  tangibleObjectDataList: TangibleObjectData[];
  addTangibleObjectData: (tangibleObjectData: TangibleObjectData) => void;
  clear: () => void;
};

export const useTangibleObjectDataStore = create<TangibleObjectDataState>((set) => ({
  tangibleObjectDataList: [
    {
        id: "TO_A",
        simulatorKey: "A",
        distAB: 96,
        distBC: 94,
        distCA: 92
    },
    {
        id: "TO_B",
        simulatorKey: "B",
        distAB: 112,
        distBC: 104,
        distCA: 108
    },
    {
        "id": "TO_C",
        simulatorKey: "C",
        distAB: 73,
        distBC: 47,
        distCA: 75
    },
    {
        "id": "TO_D",
        simulatorKey: "D",
        distAB: 144,
        distBC: 93.8,
        distCA: 148.2
    }
  ],

  addTangibleObjectData: (tangibleObjectData: TangibleObjectData) =>
    set((state: { tangibleObjectDataList: TangibleObjectData[]; }) => {

        let i = 0;

        while (i < state.tangibleObjectDataList.length) {
            
            if(state.tangibleObjectDataList[i].id === tangibleObjectData.id){
                state.tangibleObjectDataList.splice(i);
            }
            else{
                i++;
            }
        }

        return {tangibleObjectDataList: [...state.tangibleObjectDataList, tangibleObjectData]}
    }),

    clear: () => set({ tangibleObjectDataList: [
        {
            id: "TO_A",
            simulatorKey: "A",
            distAB: 96,
            distBC: 94,
            distCA: 92
        },
        {
            id: "TO_B",
            simulatorKey: "B",
            distAB: 112,
            distBC: 104,
            distCA: 108
        },
        {
            "id": "TO_C",
            simulatorKey: "C",
            distAB: 73,
            distBC: 47,
            distCA: 75
        },
        {
            "id": "TO_D",
            simulatorKey: "D",
            distAB: 144,
            distBC: 93.8,
            distCA: 148.2
        }
    ] }),
}));