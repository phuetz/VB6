import React, { useState, useCallback } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import {
  createVB6NativeCompiler,
  CompilationTarget,
  CompilerOptions,
  CompilationResult,
} from '../../compiler/VB6NativeCompiler';
import { Platform } from '../../compiler/VB6Linker';

export const CompilerPanel: React.FC = () => {
  const { forms, modules } = useVB6Store();
  const [isCompiling, setIsCompiling] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<CompilationTarget>(CompilationTarget.X86_32);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(Platform.WINDOWS_X86);
  const [optimizationLevel, setOptimizationLevel] = useState(2);
  const [includeDebugInfo, setIncludeDebugInfo] = useState(false);
  const [embedRuntime, setEmbedRuntime] = useState(true);
  const [entryPoint, setEntryPoint] = useState('Main');

  const addOutput = useCallback((message: string) => {
    setOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    setOutput([]);
    addOutput('Starting compilation...');

    try {
      // Collect source files
      const sourceFiles: { [filename: string]: string } = {};

      // Add forms
      forms.forEach(form => {
        const filename = `${form.name}.frm`;
        sourceFiles[filename] = generateFormCode(form);
        addOutput(`Processing form: ${filename}`);
      });

      // Add modules
      modules.forEach(module => {
        const filename = `${module.name}.bas`;
        sourceFiles[filename] = module.code;
        addOutput(`Processing module: ${filename}`);
      });

      if (Object.keys(sourceFiles).length === 0) {
        throw new Error('No source files to compile');
      }

      // Create compiler instance
      const compiler = createVB6NativeCompiler();

      // Set compiler options
      const options: CompilerOptions = {
        target: selectedTarget,
        optimizationLevel,
        debugInfo: includeDebugInfo,
        outputPath: 'output',
        linkLibraries: ['vb6runtime', 'user32', 'kernel32'],
        entryPoint,
      };

      addOutput(`Target: ${selectedTarget}, Platform: ${selectedPlatform}`);
      addOutput(`Optimization level: ${optimizationLevel}`);
      addOutput('');

      // Compile
      const result: CompilationResult = await compiler.compile(sourceFiles, options);

      if (result.success && result.executable) {
        addOutput('✅ Compilation successful!');
        addOutput(`Output format: ${result.executable.format}`);
        addOutput(`Entry point: ${result.executable.entryPoint}`);
        addOutput(`Size: ${formatBytes(result.executable.data.length)}`);

        // Download executable
        downloadExecutable(result.executable.data, getOutputFilename());
      } else {
        addOutput('❌ Compilation failed!');
        result.diagnostics.forEach(diag => {
          const icon = diag.severity === 'error' ? '❌' : diag.severity === 'warning' ? '⚠️' : 'ℹ️';
          addOutput(`${icon} ${diag.message}`);
          if (diag.location) {
            addOutput(`   at line ${diag.location.line}, column ${diag.location.column}`);
          }
        });
      }
    } catch (error: any) {
      addOutput(`❌ Error: ${error.message}`);
    } finally {
      setIsCompiling(false);
      addOutput('');
      addOutput('Compilation complete.');
    }
  }, [
    forms,
    modules,
    selectedTarget,
    selectedPlatform,
    optimizationLevel,
    includeDebugInfo,
    entryPoint,
    addOutput,
    getOutputFilename,
  ]);

  const generateFormCode = (form: any): string => {
    // Generate VB6 form code
    let code = `VERSION 5.00\n`;
    code += `Begin VB.Form ${form.name}\n`;
    code += `   Caption = "${form.caption || form.name}"\n`;
    code += `   ClientHeight = ${form.height}\n`;
    code += `   ClientWidth = ${form.width}\n`;
    code += `   StartUpPosition = ${form.startUpPosition || 3}\n`;

    // Add controls
    form.controls?.forEach((control: any) => {
      code += `   Begin VB.${control.type} ${control.name}\n`;
      code += `      Left = ${control.x}\n`;
      code += `      Top = ${control.y}\n`;
      code += `      Width = ${control.width}\n`;
      code += `      Height = ${control.height}\n`;
      if (control.caption) code += `      Caption = "${control.caption}"\n`;
      code += `   End\n`;
    });

    code += `End\n\n`;

    // Add code behind
    if (form.code) {
      code += form.code;
    }

    return code;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getOutputFilename = useCallback((): string => {
    const extensions: { [key: string]: string } = {
      [CompilationTarget.X86_32]: '.exe',
      [CompilationTarget.X86_64]: '.exe',
      [CompilationTarget.WASM]: '.wasm',
      [CompilationTarget.LLVM_IR]: '.ll',
    };

    const projectName = forms[0]?.name || 'output';
    return `${projectName}${extensions[selectedTarget] || '.bin'}`;
  }, [forms, selectedTarget]);

  const downloadExecutable = (data: Uint8Array, filename: string) => {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <h2 className="text-lg font-semibold">VB6 Native Compiler</h2>
      </div>

      {/* Options */}
      <div className="p-4 space-y-4 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          {/* Target */}
          <div>
            <label className="block text-sm font-medium mb-1">Compilation Target</label>
            <select
              value={selectedTarget}
              onChange={e => setSelectedTarget(e.target.value as CompilationTarget)}
              className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              disabled={isCompiling}
            >
              <option value={CompilationTarget.X86_32}>x86 (32-bit)</option>
              <option value={CompilationTarget.X86_64}>x64 (64-bit)</option>
              <option value={CompilationTarget.WASM}>WebAssembly</option>
              <option value={CompilationTarget.LLVM_IR}>LLVM IR</option>
            </select>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium mb-1">Target Platform</label>
            <select
              value={selectedPlatform}
              onChange={e => setSelectedPlatform(e.target.value as Platform)}
              className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              disabled={isCompiling || selectedTarget === CompilationTarget.WASM}
            >
              <option value={Platform.WINDOWS_X86}>Windows x86</option>
              <option value={Platform.WINDOWS_X64}>Windows x64</option>
              <option value={Platform.LINUX_X86}>Linux x86</option>
              <option value={Platform.LINUX_X64}>Linux x64</option>
              <option value={Platform.MACOS_X64}>macOS x64</option>
              <option value={Platform.MACOS_ARM}>macOS ARM</option>
            </select>
          </div>

          {/* Optimization */}
          <div>
            <label className="block text-sm font-medium mb-1">Optimization Level</label>
            <select
              value={optimizationLevel}
              onChange={e => setOptimizationLevel(Number(e.target.value))}
              className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              disabled={isCompiling}
            >
              <option value={0}>None (-O0)</option>
              <option value={1}>Basic (-O1)</option>
              <option value={2}>Standard (-O2)</option>
              <option value={3}>Aggressive (-O3)</option>
            </select>
          </div>

          {/* Entry Point */}
          <div>
            <label className="block text-sm font-medium mb-1">Entry Point</label>
            <input
              type="text"
              value={entryPoint}
              onChange={e => setEntryPoint(e.target.value)}
              className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              placeholder="Main"
              disabled={isCompiling}
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex gap-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeDebugInfo}
              onChange={e => setIncludeDebugInfo(e.target.checked)}
              className="mr-2"
              disabled={isCompiling}
            />
            <span className="text-sm">Include Debug Info</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={embedRuntime}
              onChange={e => setEmbedRuntime(e.target.checked)}
              className="mr-2"
              disabled={isCompiling}
            />
            <span className="text-sm">Embed Runtime</span>
          </label>
        </div>

        {/* Compile Button */}
        <button
          onClick={handleCompile}
          disabled={isCompiling}
          className={`w-full py-2 px-4 rounded font-medium transition-colors ${
            isCompiling
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isCompiling ? 'Compiling...' : 'Compile to Native Code'}
        </button>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-gray-800 rounded p-3 h-full">
          <div className="font-mono text-sm space-y-1">
            {output.length === 0 ? (
              <div className="text-gray-500">Compiler output will appear here...</div>
            ) : (
              output.map((line, index) => (
                <div
                  key={index}
                  className={
                    line.includes('✅')
                      ? 'text-green-400'
                      : line.includes('❌')
                        ? 'text-red-400'
                        : line.includes('⚠️')
                          ? 'text-yellow-400'
                          : line.includes('[')
                            ? 'text-gray-400'
                            : 'text-gray-200'
                  }
                >
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompilerPanel;
