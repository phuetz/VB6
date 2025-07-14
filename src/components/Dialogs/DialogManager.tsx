import React from 'react';
import { useVB6 } from '../../context/VB6Context';
import NewProjectDialog from './NewProjectDialog';
import ReferencesDialog from './ReferencesDialog';
import ComponentsDialog from './ComponentsDialog';
import { MenuEditor } from '../Designer/MenuEditor';
import { ObjectBrowser } from '../ObjectBrowser/ObjectBrowser';
import { FormLayout } from '../Forms/FormLayout';
import { UserControlDesigner } from '../UserControls/UserControlDesigner';
import OptionsDialog from './OptionsDialog';

const DialogManager: React.FC = () => {
  const { state, dispatch } = useVB6();

  return (
    <>
      {state.showNewProjectDialog && <NewProjectDialog />}
      {state.showReferences && <ReferencesDialog />}
      {state.showComponents && <ComponentsDialog />}
      {state.showMenuEditor && (
        <MenuEditor
          visible={state.showMenuEditor}
          onClose={() => dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showMenuEditor', show: false } })}
          onSave={(menus) => {
            // Save menus to form
            console.log('Saving menus:', menus);
          }}
        />
      )}
      {state.showObjectBrowser && (
        <ObjectBrowser
          visible={state.showObjectBrowser}
          onClose={() => dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showObjectBrowser', show: false } })}
        />
      )}
      {state.showFormLayout && (
        <FormLayout
          visible={state.showFormLayout}
          onClose={() => dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showFormLayout', show: false } })}
        />
      )}
      {state.showUserControlDesigner && (
        <UserControlDesigner
          visible={state.showUserControlDesigner}
          onClose={() => dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showUserControlDesigner', show: false } })}
        />
      )}
      {state.showOptionsDialog && (
        <OptionsDialog />
      )}
    </>
  );
};

export default DialogManager;