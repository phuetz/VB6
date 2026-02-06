import React, { useState, useCallback } from 'react';

// Version Info Types
export enum VersionType {
  Major = 'major',
  Minor = 'minor',
  Revision = 'revision',
}

// File Flags
export enum FileFlags {
  Debug = 0x1,
  PreRelease = 0x2,
  Patched = 0x4,
  PrivateBuild = 0x8,
  InfoInferred = 0x10,
  SpecialBuild = 0x20,
}

// File Type
export enum FileType {
  App = 0x1,
  Dll = 0x2,
  Driver = 0x3,
  Font = 0x4,
  VXD = 0x5,
  StaticLib = 0x7,
}

// File Subtype (for drivers)
export enum FileSubtype {
  Unknown = 0x0,
  PrinterDriver = 0x1,
  KeyboardDriver = 0x2,
  LanguageDriver = 0x3,
  DisplayDriver = 0x4,
  MouseDriver = 0x5,
  NetworkDriver = 0x6,
  SystemDriver = 0x7,
  InstallableDriver = 0x8,
  SoundDriver = 0x9,
}

// Version Info Structure
export interface VersionInfo {
  // Fixed Info
  fileVersion: {
    major: number;
    minor: number;
    revision: number;
    build: number;
  };
  productVersion: {
    major: number;
    minor: number;
    revision: number;
    build: number;
  };
  fileFlagsMask: number;
  fileFlags: number;
  fileOS: number;
  fileType: FileType;
  fileSubtype: FileSubtype;
  fileDate: Date;

  // String Info
  companyName: string;
  fileDescription: string;
  fileVersion: string;
  internalName: string;
  legalCopyright: string;
  originalFilename: string;
  productName: string;
  productVersion: string;
  comments?: string;
  legalTrademarks?: string;
  privateBuild?: string;
  specialBuild?: string;

  // Language & Code Page
  language: string;
  codePage: string;
}

// Common Languages
const LANGUAGES = [
  { code: '0409', name: 'English (United States)' },
  { code: '0809', name: 'English (United Kingdom)' },
  { code: '040C', name: 'French (France)' },
  { code: '0407', name: 'German (Germany)' },
  { code: '040A', name: 'Spanish (Spain)' },
  { code: '0410', name: 'Italian (Italy)' },
  { code: '0411', name: 'Japanese' },
  { code: '0412', name: 'Korean' },
  { code: '0804', name: 'Chinese (Simplified)' },
  { code: '0404', name: 'Chinese (Traditional)' },
  { code: '0419', name: 'Russian' },
  { code: '0416', name: 'Portuguese (Brazil)' },
];

// Common Code Pages
const CODE_PAGES = [
  { code: '04B0', name: 'Unicode' },
  { code: '04E4', name: 'Windows-1252 (Western European)' },
  { code: '03A4', name: 'Windows-932 (Japanese Shift-JIS)' },
  { code: '03B5', name: 'Windows-949 (Korean)' },
  { code: '03A8', name: 'Windows-936 (Simplified Chinese GBK)' },
  { code: '03B6', name: 'Windows-950 (Traditional Chinese Big5)' },
];

interface VersionInfoEditorProps {
  initialVersionInfo?: VersionInfo;
  onSave?: (versionInfo: VersionInfo) => void;
  onExport?: (data: string) => void;
}

export const VersionInfoEditor: React.FC<VersionInfoEditorProps> = ({
  initialVersionInfo,
  onSave,
  onExport,
}) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>(
    initialVersionInfo || {
      fileVersion: { major: 1, minor: 0, revision: 0, build: 0 },
      productVersion: { major: 1, minor: 0, revision: 0, build: 0 },
      fileFlagsMask: 0x3f,
      fileFlags: 0,
      fileOS: 0x4, // VOS_NT_WINDOWS32
      fileType: FileType.App,
      fileSubtype: FileSubtype.Unknown,
      fileDate: new Date(),
      companyName: '',
      fileDescription: '',
      fileVersion: '1.0.0.0',
      internalName: '',
      legalCopyright: `Copyright © ${new Date().getFullYear()}`,
      originalFilename: '',
      productName: '',
      productVersion: '1.0.0.0',
      language: '0409',
      codePage: '04B0',
    }
  );

  const [activeTab, setActiveTab] = useState<'fixed' | 'strings' | 'language'>('fixed');

  const updateVersionInfo = useCallback((updates: Partial<VersionInfo>) => {
    setVersionInfo(prev => ({ ...prev, ...updates }));
  }, []);

  const updateFileVersion = useCallback(
    (field: 'major' | 'minor' | 'revision' | 'build', value: number) => {
      setVersionInfo(prev => {
        const newFileVersion = { ...prev.fileVersion, [field]: value };
        const versionString = `${newFileVersion.major}.${newFileVersion.minor}.${newFileVersion.revision}.${newFileVersion.build}`;
        return {
          ...prev,
          fileVersion: newFileVersion,
          fileVersion: versionString,
        };
      });
    },
    []
  );

  const updateProductVersion = useCallback(
    (field: 'major' | 'minor' | 'revision' | 'build', value: number) => {
      setVersionInfo(prev => {
        const newProductVersion = { ...prev.productVersion, [field]: value };
        const versionString = `${newProductVersion.major}.${newProductVersion.minor}.${newProductVersion.revision}.${newProductVersion.build}`;
        return {
          ...prev,
          productVersion: newProductVersion,
          productVersion: versionString,
        };
      });
    },
    []
  );

  const toggleFileFlag = useCallback((flag: FileFlags) => {
    setVersionInfo(prev => ({
      ...prev,
      fileFlags: prev.fileFlags ^ flag,
    }));
  }, []);

  const handleAutoIncrement = useCallback(
    (versionType: 'file' | 'product', incrementType: VersionType) => {
      if (versionType === 'file') {
        switch (incrementType) {
          case VersionType.Major:
            updateFileVersion('major', versionInfo.fileVersion.major + 1);
            updateFileVersion('minor', 0);
            updateFileVersion('revision', 0);
            break;
          case VersionType.Minor:
            updateFileVersion('minor', versionInfo.fileVersion.minor + 1);
            updateFileVersion('revision', 0);
            break;
          case VersionType.Revision:
            updateFileVersion('revision', versionInfo.fileVersion.revision + 1);
            break;
        }
      } else {
        switch (incrementType) {
          case VersionType.Major:
            updateProductVersion('major', versionInfo.productVersion.major + 1);
            updateProductVersion('minor', 0);
            updateProductVersion('revision', 0);
            break;
          case VersionType.Minor:
            updateProductVersion('minor', versionInfo.productVersion.minor + 1);
            updateProductVersion('revision', 0);
            break;
          case VersionType.Revision:
            updateProductVersion('revision', versionInfo.productVersion.revision + 1);
            break;
        }
      }
    },
    [versionInfo, updateFileVersion, updateProductVersion]
  );

  const handleSave = useCallback(() => {
    onSave?.(versionInfo);
  }, [versionInfo, onSave]);

  const handleExport = useCallback(() => {
    // Generate RC file format
    const rcContent = generateRCFile(versionInfo);
    onExport?.(rcContent);
  }, [versionInfo, onExport]);

  const generateRCFile = (info: VersionInfo): string => {
    const lines: string[] = [];

    lines.push('1 VERSIONINFO');
    lines.push(
      `FILEVERSION ${info.fileVersion.major},${info.fileVersion.minor},${info.fileVersion.revision},${info.fileVersion.build}`
    );
    lines.push(
      `PRODUCTVERSION ${info.productVersion.major},${info.productVersion.minor},${info.productVersion.revision},${info.productVersion.build}`
    );
    lines.push(`FILEFLAGSMASK 0x${info.fileFlagsMask.toString(16)}`);
    lines.push(`FILEFLAGS 0x${info.fileFlags.toString(16)}`);
    lines.push('FILEOS 0x4');
    lines.push(`FILETYPE 0x${info.fileType.toString(16)}`);
    lines.push(`FILESUBTYPE 0x${info.fileSubtype.toString(16)}`);
    lines.push('BEGIN');
    lines.push('  BLOCK "StringFileInfo"');
    lines.push('  BEGIN');
    lines.push(`    BLOCK "${info.language}${info.codePage}"`);
    lines.push('    BEGIN');

    if (info.companyName) lines.push(`      VALUE "CompanyName", "${info.companyName}\\0"`);
    if (info.fileDescription)
      lines.push(`      VALUE "FileDescription", "${info.fileDescription}\\0"`);
    if (info.fileVersion) lines.push(`      VALUE "FileVersion", "${info.fileVersion}\\0"`);
    if (info.internalName) lines.push(`      VALUE "InternalName", "${info.internalName}\\0"`);
    if (info.legalCopyright)
      lines.push(`      VALUE "LegalCopyright", "${info.legalCopyright}\\0"`);
    if (info.originalFilename)
      lines.push(`      VALUE "OriginalFilename", "${info.originalFilename}\\0"`);
    if (info.productName) lines.push(`      VALUE "ProductName", "${info.productName}\\0"`);
    if (info.productVersion)
      lines.push(`      VALUE "ProductVersion", "${info.productVersion}\\0"`);
    if (info.comments) lines.push(`      VALUE "Comments", "${info.comments}\\0"`);
    if (info.legalTrademarks)
      lines.push(`      VALUE "LegalTrademarks", "${info.legalTrademarks}\\0"`);
    if (info.privateBuild) lines.push(`      VALUE "PrivateBuild", "${info.privateBuild}\\0"`);
    if (info.specialBuild) lines.push(`      VALUE "SpecialBuild", "${info.specialBuild}\\0"`);

    lines.push('    END');
    lines.push('  END');
    lines.push('  BLOCK "VarFileInfo"');
    lines.push('  BEGIN');
    lines.push(`    VALUE "Translation", 0x${info.language}, 0x${info.codePage}`);
    lines.push('  END');
    lines.push('END');

    return lines.join('\n');
  };

  const copyFromFile = useCallback(() => {
    // Copy product version from file version
    setVersionInfo(prev => ({
      ...prev,
      productVersion: { ...prev.fileVersion },
      productVersion: prev.fileVersion,
    }));
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Version Information</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Export RC
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('fixed')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'fixed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Fixed File Info
        </button>
        <button
          onClick={() => setActiveTab('strings')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'strings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          String Information
        </button>
        <button
          onClick={() => setActiveTab('language')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'language'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Language & Code Page
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white p-6">
        {activeTab === 'fixed' && (
          <div className="max-w-2xl space-y-6">
            {/* File Version */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">File Version</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                  <input
                    type="number"
                    min="0"
                    max="65535"
                    value={versionInfo.fileVersion.major}
                    onChange={e => updateFileVersion('major', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minor</label>
                  <input
                    type="number"
                    min="0"
                    max="65535"
                    value={versionInfo.fileVersion.minor}
                    onChange={e => updateFileVersion('minor', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Revision</label>
                  <input
                    type="number"
                    min="0"
                    max="65535"
                    value={versionInfo.fileVersion.revision}
                    onChange={e => updateFileVersion('revision', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Build</label>
                  <input
                    type="number"
                    min="0"
                    max="65535"
                    value={versionInfo.fileVersion.build}
                    onChange={e => updateFileVersion('build', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleAutoIncrement('file', VersionType.Major)}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  Increment Major
                </button>
                <button
                  onClick={() => handleAutoIncrement('file', VersionType.Minor)}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  Increment Minor
                </button>
                <button
                  onClick={() => handleAutoIncrement('file', VersionType.Revision)}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  Increment Revision
                </button>
              </div>
            </div>

            {/* Product Version */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-800">Product Version</h3>
                <button
                  onClick={copyFromFile}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Copy from File Version
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                  <input
                    type="number"
                    min="0"
                    max="65535"
                    value={versionInfo.productVersion.major}
                    onChange={e => updateProductVersion('major', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minor</label>
                  <input
                    type="number"
                    min="0"
                    max="65535"
                    value={versionInfo.productVersion.minor}
                    onChange={e => updateProductVersion('minor', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Revision</label>
                  <input
                    type="number"
                    min="0"
                    max="65535"
                    value={versionInfo.productVersion.revision}
                    onChange={e => updateProductVersion('revision', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Build</label>
                  <input
                    type="number"
                    min="0"
                    max="65535"
                    value={versionInfo.productVersion.build}
                    onChange={e => updateProductVersion('build', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleAutoIncrement('product', VersionType.Major)}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  Increment Major
                </button>
                <button
                  onClick={() => handleAutoIncrement('product', VersionType.Minor)}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  Increment Minor
                </button>
                <button
                  onClick={() => handleAutoIncrement('product', VersionType.Revision)}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  Increment Revision
                </button>
              </div>
            </div>

            {/* File Flags */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">File Flags</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(versionInfo.fileFlags & FileFlags.Debug) !== 0}
                    onChange={() => toggleFileFlag(FileFlags.Debug)}
                  />
                  <span className="text-sm">Debug Build</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(versionInfo.fileFlags & FileFlags.PreRelease) !== 0}
                    onChange={() => toggleFileFlag(FileFlags.PreRelease)}
                  />
                  <span className="text-sm">Pre-release Version</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(versionInfo.fileFlags & FileFlags.Patched) !== 0}
                    onChange={() => toggleFileFlag(FileFlags.Patched)}
                  />
                  <span className="text-sm">Patched Version</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(versionInfo.fileFlags & FileFlags.PrivateBuild) !== 0}
                    onChange={() => toggleFileFlag(FileFlags.PrivateBuild)}
                  />
                  <span className="text-sm">Private Build</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(versionInfo.fileFlags & FileFlags.SpecialBuild) !== 0}
                    onChange={() => toggleFileFlag(FileFlags.SpecialBuild)}
                  />
                  <span className="text-sm">Special Build</span>
                </label>
              </div>
            </div>

            {/* File Type */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">File Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={versionInfo.fileType}
                    onChange={e =>
                      updateVersionInfo({ fileType: parseInt(e.target.value) as FileType })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value={FileType.App}>Application (.exe)</option>
                    <option value={FileType.Dll}>Dynamic Link Library (.dll)</option>
                    <option value={FileType.Driver}>Device Driver</option>
                    <option value={FileType.Font}>Font File</option>
                    <option value={FileType.VXD}>Virtual Device</option>
                    <option value={FileType.StaticLib}>Static Library</option>
                  </select>
                </div>
                {versionInfo.fileType === FileType.Driver && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtype</label>
                    <select
                      value={versionInfo.fileSubtype}
                      onChange={e =>
                        updateVersionInfo({ fileSubtype: parseInt(e.target.value) as FileSubtype })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value={FileSubtype.Unknown}>Unknown</option>
                      <option value={FileSubtype.PrinterDriver}>Printer Driver</option>
                      <option value={FileSubtype.KeyboardDriver}>Keyboard Driver</option>
                      <option value={FileSubtype.LanguageDriver}>Language Driver</option>
                      <option value={FileSubtype.DisplayDriver}>Display Driver</option>
                      <option value={FileSubtype.MouseDriver}>Mouse Driver</option>
                      <option value={FileSubtype.NetworkDriver}>Network Driver</option>
                      <option value={FileSubtype.SystemDriver}>System Driver</option>
                      <option value={FileSubtype.InstallableDriver}>Installable Driver</option>
                      <option value={FileSubtype.SoundDriver}>Sound Driver</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strings' && (
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={versionInfo.companyName}
                onChange={e => updateVersionInfo({ companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Description
              </label>
              <input
                type="text"
                value={versionInfo.fileDescription}
                onChange={e => updateVersionInfo({ fileDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Application description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name</label>
              <input
                type="text"
                value={versionInfo.internalName}
                onChange={e => updateVersionInfo({ internalName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Internal project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Copyright
              </label>
              <input
                type="text"
                value={versionInfo.legalCopyright}
                onChange={e => updateVersionInfo({ legalCopyright: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Copyright © 2024 Your Company"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Filename
              </label>
              <input
                type="text"
                value={versionInfo.originalFilename}
                onChange={e => updateVersionInfo({ originalFilename: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="MyApp.exe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                value={versionInfo.productName}
                onChange={e => updateVersionInfo({ productName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="My Application"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
              <textarea
                value={versionInfo.comments || ''}
                onChange={e => updateVersionInfo({ comments: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Additional comments..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Trademarks
              </label>
              <input
                type="text"
                value={versionInfo.legalTrademarks || ''}
                onChange={e => updateVersionInfo({ legalTrademarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Trademark information"
              />
            </div>

            {(versionInfo.fileFlags & FileFlags.PrivateBuild) !== 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Private Build Description
                </label>
                <input
                  type="text"
                  value={versionInfo.privateBuild || ''}
                  onChange={e => updateVersionInfo({ privateBuild: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Private build information"
                />
              </div>
            )}

            {(versionInfo.fileFlags & FileFlags.SpecialBuild) !== 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Build Description
                </label>
                <input
                  type="text"
                  value={versionInfo.specialBuild || ''}
                  onChange={e => updateVersionInfo({ specialBuild: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Special build information"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'language' && (
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={versionInfo.language}
                onChange={e => updateVersionInfo({ language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code Page</label>
              <select
                value={versionInfo.codePage}
                onChange={e => updateVersionInfo({ codePage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                {CODE_PAGES.map(cp => (
                  <option key={cp.code} value={cp.code}>
                    {cp.name} ({cp.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h4 className="font-medium text-gray-700 mb-2">String Block Identifier</h4>
              <p className="text-sm text-gray-600 mb-2">
                The string block identifier is formed by concatenating the language and code page
                values.
              </p>
              <div className="font-mono text-lg bg-white px-3 py-2 border border-gray-300 rounded">
                {versionInfo.language}
                {versionInfo.codePage}
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use Unicode (04B0) code page for maximum compatibility</li>
                <li>• Language code determines the display language for version info</li>
                <li>• Multiple language blocks can be added for localization</li>
                <li>• The language/code page combination must match the actual string encoding</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>Version String: {versionInfo.fileVersion}</div>
          <div>Last Modified: {versionInfo.fileDate.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default VersionInfoEditor;
