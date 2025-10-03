import React, { useState } from 'react';

import {TangibleObject } from '../../types';

import { InternalContext, InternalContextDescriptor } from '../../store';


export interface Props {
  children?: React.ReactNode;
}

export const TOContext = function TOContext({ children }: Props) {
  const [tangibleObjects, setTangibleObjets] = useState<Array<TangibleObject>>(
    []
  );

  const internalContext: InternalContextDescriptor = {
    tangibleObjects,
    setTangibleObjets,
  };
  /*const tangibleObjects: Array<TangibleObject> = [];
  console.log(tangibleObjects);*/
  return (
    <InternalContext.Provider value={internalContext}>
      {children}
    </InternalContext.Provider>
  );
};
