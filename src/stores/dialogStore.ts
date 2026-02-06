import { create } from 'zustand';

interface DialogStore {
  dialogs: Record<string, boolean>;
  importExportMode: 'import' | 'export';
  currentReportId?: string;
  astDiffs: any[];
  openDialog: (name: string) => void;
  closeDialog: (name: string) => void;
  isOpen: (name: string) => boolean;
  setImportExportMode: (mode: 'import' | 'export') => void;
  setCurrentReportId: (id?: string) => void;
  setAstDiffs: (diffs: any[]) => void;
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  dialogs: {},
  importExportMode: 'import',
  currentReportId: undefined,
  astDiffs: [],
  openDialog: (name: string) => set(state => ({ dialogs: { ...state.dialogs, [name]: true } })),
  closeDialog: (name: string) => set(state => ({ dialogs: { ...state.dialogs, [name]: false } })),
  isOpen: (name: string) => !!get().dialogs[name],
  setImportExportMode: (mode: 'import' | 'export') => set({ importExportMode: mode }),
  setCurrentReportId: (id?: string) => set({ currentReportId: id }),
  setAstDiffs: (diffs: any[]) => set({ astDiffs: diffs }),
}));
