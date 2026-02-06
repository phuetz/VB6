import React from 'react';
import { useWindowStore } from '../../stores/windowStore';
import { shallow } from 'zustand/shallow';
import NewProjectDialog from './NewProjectDialog';
import ReferencesDialog from './ReferencesDialog';
import ComponentsDialog from './ComponentsDialog';
import { MenuEditor } from '../Designer/MenuEditor';
import { ObjectBrowser } from '../ObjectBrowser/ObjectBrowser';
import { FormLayout } from '../Forms/FormLayout';
import { UserControlDesigner } from '../UserControls/UserControlDesigner';
import OptionsDialog from './OptionsDialog';

const DialogManager: React.FC = () => {
  const {
    showNewProjectDialog,
    showReferences,
    showComponents,
    showMenuEditor,
    showObjectBrowser,
    showFormLayout,
    showUserControlDesigner,
    showOptionsDialog,
  } = useWindowStore(
    state => ({
      showNewProjectDialog: state.showNewProjectDialog,
      showReferences: state.showReferences,
      showComponents: state.showComponents,
      showMenuEditor: state.showMenuEditor,
      showObjectBrowser: state.showObjectBrowser,
      showFormLayout: state.showFormLayout,
      showUserControlDesigner: state.showUserControlDesigner,
      showOptionsDialog: state.showOptionsDialog,
    }),
    shallow
  );
  const windowShowDialog = useWindowStore(state => state.showDialog);

  return (
    <>
      {showNewProjectDialog && <NewProjectDialog />}
      {showReferences && <ReferencesDialog />}
      {showComponents && <ComponentsDialog />}
      {showMenuEditor && (
        <MenuEditor
          visible={showMenuEditor}
          onClose={() => windowShowDialog('showMenuEditor', false)}
          onSave={menus => {}}
        />
      )}
      {showObjectBrowser && (
        <ObjectBrowser
          visible={showObjectBrowser}
          onClose={() => windowShowDialog('showObjectBrowser', false)}
        />
      )}
      {showFormLayout && (
        <FormLayout
          visible={showFormLayout}
          onClose={() => windowShowDialog('showFormLayout', false)}
        />
      )}
      {showUserControlDesigner && (
        <UserControlDesigner
          visible={showUserControlDesigner}
          onClose={() => windowShowDialog('showUserControlDesigner', false)}
        />
      )}
      {showOptionsDialog && <OptionsDialog />}
    </>
  );
};

export default DialogManager;
