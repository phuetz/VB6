import React from 'react';
import { useVB6 } from '../../context/VB6Context';

const AlignmentGuides: React.FC = () => {
  const { state } = useVB6();

  if (!state.showAlignmentGuides || state.executionMode === 'run') return null;
  
  return (
    <>
      {state.alignmentGuides.x.map((x, index) => (
        <div
          key={`x-${index}`}
          className="absolute pointer-events-none"
          style={{
            left: x,
            top: 0,
            width: 1,
            height: '100%',
            backgroundColor: '#ff0000',
            zIndex: 9999
          }}
        />
      ))}
      {state.alignmentGuides.y.map((y, index) => (
        <div
          key={`y-${index}`}
          className="absolute pointer-events-none"
          style={{
            left: 0,
            top: y,
            width: '100%',
            height: 1,
            backgroundColor: '#ff0000',
            zIndex: 9999
          }}
        />
      ))}
    </>
  );
};

export default AlignmentGuides;