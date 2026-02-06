import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileText,
  Code,
  Eye,
  AlertCircle,
  CheckCircle,
  Copy,
  Folder,
} from 'lucide-react';
import { vb6FormImportExport, VB6FormDefinition } from '../../services/VB6FormImportExport';
import { useVB6Store } from '../../stores/vb6Store';
import { VB6Control } from '../../types/vb6';

interface ImportExportDialogProps {
  visible: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
}

export const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  visible,
  onClose,
  mode,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [importText, setImportText] = useState('');
  const [exportFormat, setExportFormat] = useState<'frm' | 'json'>('frm');
  const [previewForm, setPreviewForm] = useState<VB6FormDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { controls, formProperties, setControls, updateFormProperties } = useVB6Store();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    try {
      const content = await file.text();
      const formDef = vb6FormImportExport.parseFormFile(content);
      setPreviewForm(formDef);
      setSuccess(`Successfully parsed ${formDef.name} with ${formDef.controls.length} controls`);
    } catch (err: any) {
      setError(`Failed to parse file: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextImport = () => {
    if (!importText.trim()) {
      setError('Please enter VB6 form content');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    try {
      let formDef: VB6FormDefinition;

      // Try to detect if it's JSON or VB6 format
      if (importText.trim().startsWith('{')) {
        // JSON format
        formDef = vb6FormImportExport.importFromJSON(importText);
      } else {
        // VB6 .frm format
        formDef = vb6FormImportExport.parseFormFile(importText);
      }

      setPreviewForm(formDef);
      setSuccess(`Successfully parsed ${formDef.name} with ${formDef.controls.length} controls`);
    } catch (err: any) {
      setError(`Failed to parse content: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportConfirm = () => {
    if (!previewForm) return;

    try {
      // Convert form definition to VB6 controls
      const newControls = vb6FormImportExport.convertFormDefinitionToControls(previewForm);

      // Update the store
      setControls(newControls);
      updateFormProperties({
        Name: previewForm.name,
        Caption: previewForm.caption,
        Width: previewForm.width,
        Height: previewForm.height,
        ...previewForm.properties,
      });

      setSuccess(`Imported ${previewForm.name} with ${newControls.length} controls`);

      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(`Failed to import form: ${err.message}`);
    }
  };

  const handleExport = () => {
    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    try {
      // Convert current form to form definition
      const formDef = vb6FormImportExport.convertControlsToFormDefinition(
        controls,
        formProperties,
        '// Generated VB6 form code\n'
      );

      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'frm') {
        content = vb6FormImportExport.generateFormFile(formDef);
        filename = `${formDef.name}.frm`;
        mimeType = 'text/plain';
      } else {
        content = vb6FormImportExport.exportAsJSON(formDef);
        filename = `${formDef.name}.json`;
        mimeType = 'application/json';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`Exported ${filename} successfully`);
    } catch (err: any) {
      setError(`Failed to export form: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToClipboard = () => {
    try {
      const formDef = vb6FormImportExport.convertControlsToFormDefinition(
        controls,
        formProperties,
        '// Generated VB6 form code\n'
      );

      let content: string;
      if (exportFormat === 'frm') {
        content = vb6FormImportExport.generateFormFile(formDef);
      } else {
        content = vb6FormImportExport.exportAsJSON(formDef);
      }

      navigator.clipboard.writeText(content);
      setSuccess('Copied to clipboard');
    } catch (err: any) {
      setError(`Failed to copy: ${err.message}`);
    }
  };

  const resetDialog = () => {
    setActiveTab('file');
    setImportText('');
    setPreviewForm(null);
    setError(null);
    setSuccess(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mode === 'import' ? (
              <Upload className="text-blue-500" size={24} />
            ) : (
              <Download className="text-green-500" size={24} />
            )}
            <h2 className="text-xl font-semibold text-gray-800">
              {mode === 'import' ? 'Import VB6 Form' : 'Export VB6 Form'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {mode === 'import' ? (
            <>
              {/* Import Tabs */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('file')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'file'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Folder size={16} />
                    Upload File
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'text'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FileText size={16} />
                    Paste Text
                  </button>
                </div>
              </div>

              {/* Import Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'file' ? (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select VB6 Form File
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Choose a .frm file or JSON export to import
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".frm,.json,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                      >
                        {isProcessing ? 'Processing...' : 'Choose File'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        VB6 Form Content
                      </label>
                      <textarea
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        placeholder="Paste your VB6 .frm file content or JSON export here..."
                        className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleTextImport}
                      disabled={!importText.trim() || isProcessing}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      {isProcessing ? 'Processing...' : 'Parse Content'}
                    </button>
                  </div>
                )}

                {/* Preview */}
                {previewForm && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="text-green-500" size={20} />
                      <h4 className="font-semibold text-gray-800">Form Preview</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Name:</strong> {previewForm.name}
                      </div>
                      <div>
                        <strong>Caption:</strong> {previewForm.caption}
                      </div>
                      <div>
                        <strong>Size:</strong> {previewForm.width} × {previewForm.height}
                      </div>
                      <div>
                        <strong>Controls:</strong> {previewForm.controls.length}
                      </div>
                      {previewForm.controls.length > 0 && (
                        <div>
                          <strong>Control Types:</strong>{' '}
                          {Array.from(new Set(previewForm.controls.map(c => c.type))).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Export Options */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="frm"
                        checked={exportFormat === 'frm'}
                        onChange={e => setExportFormat(e.target.value as 'frm' | 'json')}
                        className="mr-2"
                      />
                      <Code className="mr-1" size={16} />
                      VB6 Form (.frm)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="json"
                        checked={exportFormat === 'json'}
                        onChange={e => setExportFormat(e.target.value as 'frm' | 'json')}
                        className="mr-2"
                      />
                      <FileText className="mr-1" size={16} />
                      JSON Export (.json)
                    </label>
                  </div>
                </div>
              </div>

              {/* Export Content */}
              <div className="flex-1 p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Current Form</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <strong>Name:</strong> {formProperties.Name || 'Form1'}
                      </div>
                      <div>
                        <strong>Caption:</strong> {formProperties.Caption || 'Form1'}
                      </div>
                      <div>
                        <strong>Size:</strong> {formProperties.Width || 600} ×{' '}
                        {formProperties.Height || 400}
                      </div>
                      <div>
                        <strong>Controls:</strong> {controls.length}
                      </div>
                      {controls.length > 0 && (
                        <div>
                          <strong>Control Types:</strong>{' '}
                          {Array.from(new Set(controls.map(c => c.type))).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleExport}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      <Download size={16} />
                      {isProcessing ? 'Exporting...' : 'Download File'}
                    </button>
                    <button
                      onClick={handleCopyToClipboard}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Copy size={16} />
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Status Messages */}
          {(error || success) && (
            <div className="px-6 py-3 border-t border-gray-200">
              {error && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={16} />
                  <span className="text-sm">{success}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {mode === 'import'
              ? 'Import VB6 forms to continue your projects in the web IDE'
              : 'Export your forms for use in Visual Basic 6'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {mode === 'import' && previewForm && (
              <button
                onClick={handleImportConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Import Form
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportDialog;
