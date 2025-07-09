import React from 'react';
import { VB6Provider } from '../../context/VB6Context';
import TitleBar from '../Layout/TitleBar';
import MenuBar from '../Layout/MenuBar';
import Toolbar from '../Layout/Toolbar';
import MainContent from '../Layout/MainContent';
import StatusBar from '../Layout/StatusBar';
import DialogManager from '../Dialogs/DialogManager';

const VB6IDE: React.FC = () => {
  return (
    <VB6Provider>
      <div className="h-screen bg-gray-200 flex flex-col overflow-hidden" style={{ fontFamily: 'MS Sans Serif, sans-serif' }}>
        <TitleBar />
        <MenuBar />
        <Toolbar />
        <MainContent />
        <StatusBar />
        <DialogManager />
      </div>
    </VB6Provider>
  );
};

export default VB6IDE;