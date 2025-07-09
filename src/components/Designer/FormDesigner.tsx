import React, { useRef, useCallback } from 'react';
import { useVB6 } from '../../context/VB6Context';
import { DesignerCanvas } from './DesignerCanvas';

const FormDesigner: React.FC = () => {
  const { state } = useVB6();

  return <DesignerCanvas 
    width={state.formProperties.Width} 
    height={state.formProperties.Height} 
    backgroundColor={state.formProperties.BackColor} 
  />;
};

export default FormDesigner;