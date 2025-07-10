import ProjectExplorer from './components/Panels/ProjectExplorer/ProjectExplorer';
import PropertiesWindow from './components/Panels/PropertiesWindow/PropertiesWindow';
import ImmediateWindow from './components/Panels/ImmediateWindow/ImmediateWindow';
import { EnhancedErrorList } from './components/ErrorList/EnhancedErrorList';
import { CommandPalette } from './components/CommandPalette/CommandPalette'; 
import { ExportDialog } from './components/Export/ExportDialog'; 
import { SnippetManager } from './components/Snippets/SnippetManager'; 
import { CodeFormatter } from './components/Formatting/CodeFormatter';
import { CodeConverter } from './components/Converter/CodeConverter';
import { useVB6Store } from './stores/vb6Store';
import { EnhancedIntelliSense } from './components/Editor/EnhancedIntelliSense';
import { CodeAnalyzer } from './components/Analysis/CodeAnalyzer';

const [showProjectWizard, setShowProjectWizard] = React.useState(false);
const [showCodeAnalyzer, setShowCodeAnalyzer] = React.useState(false);
const [showRefactorTools, setShowRefactorTools] = React.useState(false);
const [showBreakpointManager, setShowBreakpointManager] = React.useState(false); 
const [showErrorList, setShowErrorList] = React.useState(false);
const [showCommandPalette, setShowCommandPalette] = React.useState(false);
const [showExportDialog, setShowExportDialog] = React.useState(false);
const [showSnippetManager, setShowSnippetManager] = React.useState(false);
const [showCodeFormatter, setShowCodeFormatter] = React.useState(false);
const [showCodeConverter, setShowCodeConverter] = React.useState(false);

<CodeFormatter
  visible={showCodeFormatter}
  onClose={() => setShowCodeFormatter(false)}
  onApplyFormatting={(formattedCode) => {
    console.log('Apply formatting', formattedCode);
    // Implementation would apply the formatting to the current editor
  }}
/>

<CodeConverter
  visible={showCodeConverter}
  onClose={() => setShowCodeConverter(false)}
  onConvertCode={(code, targetLanguage, options) => {
    console.log('Convert code to', targetLanguage, 'with options', options);
    // Implementation would handle the converted code
  }}
/>

<EnhancedErrorList
  visible={showErrorList}
  onClose={() => setShowErrorList(false)}
  onNavigateToError={(file, line, column) => {
    console.log('Navigating to', file, line, column);
    // Implementation would navigate to the file and position
  }}
  onFixError={(errorId) => {
    console.log('Fix error', errorId);
    // Implementation would apply automated fixes
  }}
  onClearErrors={() => {
    console.log('Clear all errors');
    // Implementation would clear the error list
  }}
/>

<CommandPalette
  visible={showCommandPalette}
  onClose={() => setShowCommandPalette(false)}
/>

<ExportDialog
  visible={showExportDialog}
  onClose={() => setShowExportDialog(false)}
  onExport={(format, options) => {
    console.log('Exporting to', format, 'with options', options);
    // Implementation would handle the export
  }}
/>

<SnippetManager
  visible={showSnippetManager}
  onClose={() => setShowSnippetManager(false)}
  onInsertSnippet={(snippet) => {
    console.log('Insert snippet', snippet);
    // Implementation would insert the snippet into the editor
  }}
/>
</div>
</DragDropProvider>
</VB6Provider>