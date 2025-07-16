/**
 * Contrôles ActiveX et OCX pour VB6 Studio
 * Implémentation complète des contrôles ActiveX les plus utilisés
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useVB6Store } from '../../stores/vb6Store';

// Interface pour les contrôles ActiveX
interface ActiveXControlProps {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: boolean;
  enabled?: boolean;
  tag?: string;
  [key: string]: any;
}

// CommonDialog - Contrôle de dialogues système
export const CommonDialog = forwardRef<HTMLDivElement, ActiveXControlProps>((props, ref) => {
  const { id, name, visible = true, enabled = true, tag, ...rest } = props;
  const { fireEvent } = useVB6Store();

  const [dialogType, setDialogType] = useState<'open' | 'save' | 'font' | 'color' | 'print' | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [selectedFont, setSelectedFont] = useState<any>({
    name: 'Arial',
    size: 12,
    bold: false,
    italic: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Méthodes CommonDialog
  const showOpen = useCallback(() => {
    if (!enabled) return;
    
    setDialogType('open');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [enabled]);

  const showSave = useCallback(() => {
    if (!enabled) return;
    
    setDialogType('save');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [enabled]);

  const showColor = useCallback(() => {
    if (!enabled) return;
    
    setDialogType('color');
    const color = window.prompt('Sélectionnez une couleur (format hex):', selectedColor);
    if (color) {
      setSelectedColor(color);
      fireEvent(name, 'ColorChanged', { color });
    }
  }, [enabled, selectedColor, name, fireEvent]);

  const showFont = useCallback(() => {
    if (!enabled) return;
    
    setDialogType('font');
    const fontName = window.prompt('Nom de la police:', selectedFont.name);
    if (fontName) {
      const newFont = { ...selectedFont, name: fontName };
      setSelectedFont(newFont);
      fireEvent(name, 'FontChanged', { font: newFont });
    }
  }, [enabled, selectedFont, name, fireEvent]);

  const showPrinter = useCallback(() => {
    if (!enabled) return;
    
    setDialogType('print');
    window.print();
    fireEvent(name, 'PrintRequested', {});
  }, [enabled, name, fireEvent]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file.name);
      fireEvent(name, 'FileSelected', { fileName: file.name, file });
    }
  }, [name, fireEvent]);

  return (
    <div
      ref={ref}
      style={{ display: visible ? 'block' : 'none' }}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      
      {/* Interface pour les développeurs */}
      <div className="hidden">
        <button onClick={showOpen}>Show Open Dialog</button>
        <button onClick={showSave}>Show Save Dialog</button>
        <button onClick={showColor}>Show Color Dialog</button>
        <button onClick={showFont}>Show Font Dialog</button>
        <button onClick={showPrinter}>Show Print Dialog</button>
      </div>
    </div>
  );
});

// WebBrowser - Contrôle de navigateur web
export const WebBrowser = forwardRef<HTMLDivElement, ActiveXControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible = true,
    enabled = true,
    tag,
    ...rest
  } = props;

  const [url, setUrl] = useState<string>('about:blank');
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { fireEvent } = useVB6Store();

  // Méthodes WebBrowser
  const navigate = useCallback((newUrl: string) => {
    if (!enabled) return;
    
    setIsLoading(true);
    setUrl(newUrl);
    fireEvent(name, 'BeforeNavigate', { url: newUrl });
  }, [enabled, name, fireEvent]);

  const goBack = useCallback(() => {
    if (!enabled || !canGoBack) return;
    
    window.history.back();
    fireEvent(name, 'NavigateBack', {});
  }, [enabled, canGoBack, name, fireEvent]);

  const goForward = useCallback(() => {
    if (!enabled || !canGoForward) return;
    
    window.history.forward();
    fireEvent(name, 'NavigateForward', {});
  }, [enabled, canGoForward, name, fireEvent]);

  const refresh = useCallback(() => {
    if (!enabled) return;
    
    if (iframeRef.current && iframeRef.current.src) {
      // Force reload by reassigning src
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = currentSrc;
    }
    fireEvent(name, 'Refresh', {});
  }, [enabled, name, fireEvent]);

  const stop = useCallback(() => {
    if (!enabled) return;
    
    setIsLoading(false);
    fireEvent(name, 'NavigateStop', {});
  }, [enabled, name, fireEvent]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    fireEvent(name, 'NavigateComplete', { url });
  }, [url, name, fireEvent]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    fireEvent(name, 'NavigateError', { url });
  }, [url, name, fireEvent]);

  const browserStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    border: '2px inset #C0C0C0',
    backgroundColor: '#FFFFFF',
    opacity: enabled ? 1 : 0.6,
  };

  return (
    <div
      ref={ref}
      style={browserStyle}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {/* Barre d'outils */}
      <div className="flex items-center h-8 bg-gray-100 border-b border-gray-300 px-2 space-x-2">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          ◀
        </button>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          ▶
        </button>
        <button
          onClick={refresh}
          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300"
        >
          🔄
        </button>
        <button
          onClick={stop}
          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300"
        >
          ⏹
        </button>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && navigate(url)}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
          placeholder="Enter URL..."
        />
        {isLoading && (
          <div className="text-xs text-blue-600">Chargement...</div>
        )}
      </div>

      {/* Contenu du navigateur */}
      <iframe
        ref={iframeRef}
        src={url}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: 'calc(100% - 32px)',
          border: 'none',
        }}
        title="Web Browser"
      />
    </div>
  );
});

// RichTextBox - Contrôle de texte enrichi
export const RichTextBox = forwardRef<HTMLDivElement, ActiveXControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible = true,
    enabled = true,
    tag,
    ...rest
  } = props;

  const [text, setText] = useState<string>('');
  const [rtfText, setRtfText] = useState<string>('');
  const [selStart, setSelStart] = useState<number>(0);
  const [selLength, setSelLength] = useState<number>(0);
  const [selBold, setSelBold] = useState<boolean>(false);
  const [selItalic, setSelItalic] = useState<boolean>(false);
  const [selUnderline, setSelUnderline] = useState<boolean>(false);
  const [selColor, setSelColor] = useState<string>('#000000');
  const [selFontName, setSelFontName] = useState<string>('Arial');
  const [selFontSize, setSelFontSize] = useState<number>(12);
  const [maxLength, setMaxLength] = useState<number>(0);
  const [multiLine, setMultiLine] = useState<boolean>(true);
  const [scrollBars, setScrollBars] = useState<'none' | 'horizontal' | 'vertical' | 'both'>('vertical');
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [hideSelection, setHideSelection] = useState<boolean>(false);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { fireEvent } = useVB6Store();

  // Méthodes RichTextBox
  const loadFile = useCallback((fileName: string) => {
    if (!enabled) return;
    
    // Simulation du chargement de fichier
    const fileContent = `Contenu du fichier: ${fileName}`;
    setText(fileContent);
    fireEvent(name, 'FileLoaded', { fileName, content: fileContent });
  }, [enabled, name, fireEvent]);

  const saveFile = useCallback((fileName: string) => {
    if (!enabled) return;
    
    fireEvent(name, 'FileSaved', { fileName, content: text });
  }, [enabled, text, name, fireEvent]);

  const find = useCallback((searchText: string, start?: number, options?: any) => {
    if (!enabled) return -1;
    
    const startPos = start || selStart;
    const index = text.indexOf(searchText, startPos);
    
    if (index >= 0) {
      setSelStart(index);
      setSelLength(searchText.length);
      fireEvent(name, 'TextFound', { text: searchText, position: index });
      return index;
    }
    
    fireEvent(name, 'TextNotFound', { text: searchText });
    return -1;
  }, [enabled, text, selStart, name, fireEvent]);

  const selText = useCallback((newText?: string) => {
    if (!enabled) return '';
    
    if (newText !== undefined) {
      const beforeSel = text.substring(0, selStart);
      const afterSel = text.substring(selStart + selLength);
      const newFullText = beforeSel + newText + afterSel;
      setText(newFullText);
      setSelLength(newText.length);
      fireEvent(name, 'TextChanged', { text: newFullText });
    }
    
    return text.substring(selStart, selStart + selLength);
  }, [enabled, text, selStart, selLength, name, fireEvent]);

  const span = useCallback((start: number, length: number) => {
    if (!enabled) return;
    
    setSelStart(start);
    setSelLength(length);
    fireEvent(name, 'SelectionChanged', { start, length });
  }, [enabled, name, fireEvent]);

  const getLineFromChar = useCallback((charIndex: number) => {
    if (!enabled) return 0;
    
    const beforeChar = text.substring(0, charIndex);
    return beforeChar.split('\n').length - 1;
  }, [enabled, text]);

  const getCharFromLine = useCallback((lineNumber: number) => {
    if (!enabled) return 0;
    
    const lines = text.split('\n');
    let charIndex = 0;
    
    for (let i = 0; i < lineNumber && i < lines.length; i++) {
      charIndex += lines[i].length + 1; // +1 pour \n
    }
    
    return charIndex;
  }, [enabled, text]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!enabled || readOnly) return;
    
    const newText = e.target.value;
    if (maxLength > 0 && newText.length > maxLength) {
      return;
    }
    
    setText(newText);
    fireEvent(name, 'TextChanged', { text: newText });
  }, [enabled, readOnly, maxLength, name, fireEvent]);

  const handleSelectionChange = useCallback(() => {
    if (!enabled || !textAreaRef.current) return;
    
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    
    setSelStart(start);
    setSelLength(end - start);
    fireEvent(name, 'SelectionChanged', { start, length: end - start });
  }, [enabled, name, fireEvent]);

  const richTextStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    border: '2px inset #C0C0C0',
    backgroundColor: '#FFFFFF',
    opacity: enabled ? 1 : 0.6,
  };

  return (
    <div
      ref={ref}
      style={richTextStyle}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {/* Barre d'outils de formatage */}
      <div className="flex items-center h-8 bg-gray-100 border-b border-gray-300 px-2 space-x-2">
        <button
          onClick={() => setSelBold(!selBold)}
          className={`px-2 py-1 text-xs ${selBold ? 'bg-blue-200' : 'bg-gray-200'} hover:bg-gray-300`}
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => setSelItalic(!selItalic)}
          className={`px-2 py-1 text-xs ${selItalic ? 'bg-blue-200' : 'bg-gray-200'} hover:bg-gray-300`}
        >
          <em>I</em>
        </button>
        <button
          onClick={() => setSelUnderline(!selUnderline)}
          className={`px-2 py-1 text-xs ${selUnderline ? 'bg-blue-200' : 'bg-gray-200'} hover:bg-gray-300`}
        >
          <u>U</u>
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <select
          value={selFontName}
          onChange={(e) => setSelFontName(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Verdana">Verdana</option>
        </select>
        <select
          value={selFontSize}
          onChange={(e) => setSelFontSize(parseInt(e.target.value))}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="8">8</option>
          <option value="10">10</option>
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="20">20</option>
        </select>
        <input
          type="color"
          value={selColor}
          onChange={(e) => setSelColor(e.target.value)}
          className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
        />
      </div>

      {/* Zone de texte */}
      <textarea
        ref={textAreaRef}
        value={text}
        onChange={handleTextChange}
        onSelect={handleSelectionChange}
        readOnly={readOnly}
        style={{
          width: '100%',
          height: 'calc(100% - 32px)',
          border: 'none',
          outline: 'none',
          padding: '4px',
          fontSize: `${selFontSize}px`,
          fontFamily: selFontName,
          fontWeight: selBold ? 'bold' : 'normal',
          fontStyle: selItalic ? 'italic' : 'normal',
          textDecoration: selUnderline ? 'underline' : 'none',
          color: selColor,
          resize: 'none',
          whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
          overflow: scrollBars === 'both' ? 'auto' : 
                   scrollBars === 'horizontal' ? 'auto hidden' :
                   scrollBars === 'vertical' ? 'hidden auto' : 'hidden',
        }}
        placeholder="Tapez votre texte ici..."
      />
    </div>
  );
});

// MediaPlayer - Contrôle de lecture multimédia
export const MediaPlayer = forwardRef<HTMLDivElement, ActiveXControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible = true,
    enabled = true,
    tag,
    ...rest
  } = props;

  const [fileName, setFileName] = useState<string>('');
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playState, setPlayState] = useState<'stopped' | 'playing' | 'paused'>('stopped');
  const [volume, setVolume] = useState<number>(50);
  const [mute, setMute] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(0);
  const [rate, setRate] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showDisplay, setShowDisplay] = useState<boolean>(true);
  const [showStatusBar, setShowStatusBar] = useState<boolean>(true);
  const [autoStart, setAutoStart] = useState<boolean>(false);
  const [autoRewind, setAutoRewind] = useState<boolean>(false);
  const [loop, setLoop] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { fireEvent } = useVB6Store();

  // Méthodes MediaPlayer
  const open = useCallback((newFileName: string) => {
    if (!enabled) return;
    
    setFileName(newFileName);
    if (audioRef.current) {
      audioRef.current.src = newFileName;
      audioRef.current.load();
    }
    if (videoRef.current) {
      videoRef.current.src = newFileName;
      videoRef.current.load();
    }
    fireEvent(name, 'OpenStateChange', { fileName: newFileName });
  }, [enabled, name, fireEvent]);

  const play = useCallback(() => {
    if (!enabled || !fileName) return;
    
    setPlayState('playing');
    if (audioRef.current) {
      audioRef.current.play();
    }
    if (videoRef.current) {
      videoRef.current.play();
    }
    fireEvent(name, 'PlayStateChange', { state: 'playing' });
  }, [enabled, fileName, name, fireEvent]);

  const pause = useCallback(() => {
    if (!enabled) return;
    
    setPlayState('paused');
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    fireEvent(name, 'PlayStateChange', { state: 'paused' });
  }, [enabled, name, fireEvent]);

  const stop = useCallback(() => {
    if (!enabled) return;
    
    setPlayState('stopped');
    setCurrentPosition(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    fireEvent(name, 'PlayStateChange', { state: 'stopped' });
  }, [enabled, name, fireEvent]);

  const next = useCallback(() => {
    if (!enabled) return;
    
    fireEvent(name, 'NextTrack', {});
  }, [enabled, name, fireEvent]);

  const previous = useCallback(() => {
    if (!enabled) return;
    
    fireEvent(name, 'PreviousTrack', {});
  }, [enabled, name, fireEvent]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentPosition(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
    if (videoRef.current) {
      setCurrentPosition(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
    fireEvent(name, 'PositionChange', { position: currentPosition });
  }, [currentPosition, name, fireEvent]);

  const handleEnded = useCallback(() => {
    if (loop) {
      play();
    } else {
      setPlayState('stopped');
      setCurrentPosition(0);
      fireEvent(name, 'EndOfStream', {});
    }
  }, [loop, play, name, fireEvent]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const isVideo = fileName.match(/\.(mp4|avi|wmv|mov|mkv)$/i);
  const isAudio = fileName.match(/\.(mp3|wav|wma|aac|ogg)$/i);

  const playerStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    border: '2px inset #C0C0C0',
    backgroundColor: '#000000',
    opacity: enabled ? 1 : 0.6,
  };

  return (
    <div
      ref={ref}
      style={playerStyle}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {/* Zone d'affichage */}
      {showDisplay && (
        <div className="relative bg-black" style={{ height: showControls ? 'calc(100% - 80px)' : '100%' }}>
          {isVideo && (
            <video
              ref={videoRef}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              style={{ width: '100%', height: '100%' }}
              controls={false}
            />
          )}
          {isAudio && (
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              style={{ display: 'none' }}
            />
          )}
          {!fileName && (
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <div className="text-4xl mb-2">🎵</div>
                <div>Aucun fichier sélectionné</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barre d'état */}
      {showStatusBar && (
        <div className="h-6 bg-gray-200 border-t border-gray-300 flex items-center justify-between px-2 text-xs">
          <div>{fileName || 'Prêt'}</div>
          <div>{formatTime(currentPosition)} / {formatTime(duration)}</div>
        </div>
      )}

      {/* Contrôles */}
      {showControls && (
        <div className="h-14 bg-gray-100 border-t border-gray-300 flex items-center justify-center space-x-2 px-4">
          <button
            onClick={previous}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          >
            ⏮
          </button>
          <button
            onClick={playState === 'playing' ? pause : play}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          >
            {playState === 'playing' ? '⏸' : '▶'}
          </button>
          <button
            onClick={stop}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          >
            ⏹
          </button>
          <button
            onClick={next}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          >
            ⏭
          </button>
          
          <div className="flex-1 mx-4">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentPosition}
              onChange={(e) => {
                const newPosition = parseFloat(e.target.value);
                setCurrentPosition(newPosition);
                if (audioRef.current) audioRef.current.currentTime = newPosition;
                if (videoRef.current) videoRef.current.currentTime = newPosition;
              }}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMute(!mute)}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            >
              {mute ? '🔇' : '🔊'}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const newVolume = parseInt(e.target.value);
                setVolume(newVolume);
                if (audioRef.current) audioRef.current.volume = newVolume / 100;
                if (videoRef.current) videoRef.current.volume = newVolume / 100;
              }}
              className="w-16"
            />
          </div>
        </div>
      )}
    </div>
  );
});

// Calendar - Contrôle de calendrier
export const Calendar = forwardRef<HTMLDivElement, ActiveXControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible = true,
    enabled = true,
    tag,
    ...rest
  } = props;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showToday, setShowToday] = useState<boolean>(true);
  const [showWeekNumbers, setShowWeekNumbers] = useState<boolean>(false);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<number>(0); // 0 = dimanche
  const [maxSelectionCount, setMaxSelectionCount] = useState<number>(1);
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);
  const [gridBackColor, setGridBackColor] = useState<string>('#FFFFFF');
  const [gridForeColor, setGridForeColor] = useState<string>('#000000');
  const [titleBackColor, setTitleBackColor] = useState<string>('#C0C0C0');
  const [titleForeColor, setTitleForeColor] = useState<string>('#000000');
  const [trailingForeColor, setTrailingForeColor] = useState<string>('#808080');
  
  const { fireEvent } = useVB6Store();

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const getDaysInMonth = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }, []);

  const getFirstDayOfMonth = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }, []);

  const handleDateClick = useCallback((day: number) => {
    if (!enabled) return;

    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    
    if (maxSelectionCount === 1) {
      setSelectedDates([newDate]);
    } else {
      setSelectedDates(prev => {
        const existing = prev.find(d => d.getTime() === newDate.getTime());
        if (existing) {
          return prev.filter(d => d.getTime() !== newDate.getTime());
        } else if (prev.length < maxSelectionCount) {
          return [...prev, newDate];
        }
        return prev;
      });
    }
    
    fireEvent(name, 'DateClick', { date: newDate });
  }, [enabled, currentMonth, maxSelectionCount, name, fireEvent]);

  const handleMonthChange = useCallback((direction: number) => {
    if (!enabled) return;

    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
    fireEvent(name, 'MonthChange', { month: newMonth });
  }, [enabled, currentMonth, name, fireEvent]);

  const renderCalendar = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    
    const days = [];
    
    // Jours du mois précédent
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div
          key={`prev-${daysInPrevMonth - i}`}
          className="day trailing cursor-default text-center py-1"
          style={{ color: trailingForeColor, opacity: 0.5 }}
        >
          {daysInPrevMonth - i}
        </div>
      );
    }
    
    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = showToday && dayDate.toDateString() === today.toDateString();
      const isSelected = selectedDates.some(d => d.toDateString() === dayDate.toDateString());
      
      days.push(
        <div
          key={day}
          className="day current cursor-pointer text-center py-1 hover:bg-gray-200"
          style={{
            backgroundColor: isSelected ? '#316AC5' : isToday ? '#FFFF00' : 'transparent',
            color: isSelected ? '#FFFFFF' : gridForeColor,
            fontWeight: isToday ? 'bold' : 'normal',
            border: isToday ? '1px solid #FF0000' : 'none',
          }}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </div>
      );
    }
    
    // Jours du mois suivant
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className="day trailing cursor-default text-center py-1"
          style={{ color: trailingForeColor, opacity: 0.5 }}
        >
          {day}
        </div>
      );
    }
    
    return days;
  }, [currentMonth, selectedDates, showToday, gridForeColor, trailingForeColor, getDaysInMonth, getFirstDayOfMonth, handleDateClick]);

  const calendarStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: gridBackColor,
    border: '2px inset #C0C0C0',
    opacity: enabled ? 1 : 0.6,
    fontSize: '12px',
    fontFamily: 'MS Sans Serif',
  };

  return (
    <div
      ref={ref}
      style={calendarStyle}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {/* En-tête */}
      <div
        className="flex items-center justify-between px-2 py-1 border-b border-gray-300"
        style={{ backgroundColor: titleBackColor, color: titleForeColor }}
      >
        <button
          onClick={() => handleMonthChange(-1)}
          disabled={!enabled}
          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
        >
          ◀
        </button>
        <span className="font-bold">
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          onClick={() => handleMonthChange(1)}
          disabled={!enabled}
          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
        >
          ▶
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 border-b border-gray-300 bg-gray-100">
        {daysOfWeek.map(day => (
          <div
            key={day}
            className="text-center py-1 text-xs font-bold border-r border-gray-300"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {renderCalendar().map((day, index) => (
          <div
            key={index}
            className="border-r border-b border-gray-300 text-xs"
            style={{ ...day.props.style }}
            onClick={day.props.onClick}
          >
            {day.props.children}
          </div>
        ))}
      </div>
    </div>
  );
});

export default {
  CommonDialog,
  WebBrowser,
  RichTextBox,
  MediaPlayer,
  Calendar,
};