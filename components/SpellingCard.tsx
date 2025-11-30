import React, { useState, useRef, useEffect } from 'react';
import { Word } from '../types';
import { Button } from './Button';
import { Check, X, Volume2, Shuffle, Lightbulb } from 'lucide-react';

interface SpellingCardProps {
  word: Word;
  onCorrect: () => void;
  index: number;
  total: number;
  playAudio: () => void;
  isLoadingAudio: boolean;
}

type Mode = 'TYPE' | 'SCRAMBLE';

export const SpellingCard: React.FC<SpellingCardProps> = ({ 
  word, 
  onCorrect, 
  index, 
  total,
  playAudio,
  isLoadingAudio
}) => {
  const [mode, setMode] = useState<Mode>('TYPE');
  const [input, setInput] = useState('');
  const [scrambledLetters, setScrambledLetters] = useState<{id: number, char: string}[]>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [hintIndex, setHintIndex] = useState(0); // How many characters are revealed/locked
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialization
  useEffect(() => {
    const newMode = Math.random() > 0.3 ? 'TYPE' : 'SCRAMBLE';
    setMode(newMode);
    resetState();
    
    // Scramble Setup
    if (newMode === 'SCRAMBLE') {
      const chars = word.word.split('').map((char, i) => ({ id: i, char }));
      // Fisher-Yates shuffle
      for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }
      setScrambledLetters(chars);
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    
    playAudio();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  const resetState = () => {
    setInput('');
    setStatus('idle');
    setHintIndex(0);
  };

  // --- LOGIC ---

  const handleCorrect = () => {
    setStatus('correct');
    const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
    
    setTimeout(() => {
      onCorrect();
    }, 1500); // Wait for animation
  };

  const handleIncorrect = () => {
    setStatus('incorrect');
    
    // PROGRESSIVE HINT LOGIC
    // Reveal one more letter than currently revealed
    const nextHintIndex = Math.min(hintIndex + 1, word.word.length);
    setHintIndex(nextHintIndex);

    // Auto-fill the correct prefix based on the new hint level
    const correctPrefix = word.word.substring(0, nextHintIndex);
    setInput(correctPrefix);

    // If in Scramble mode, we need to remove the used letters from the pool
    if (mode === 'SCRAMBLE') {
      const remainingChars: {id: number, char: string}[] = [];
      const usedIndices = new Set<number>();
      
      // Re-calculate available tiles: All chars minus the ones we just auto-filled
      // This is a bit complex for scramble, so we do a simple reset of the pool minus hints
      // Easier way: Logic just visually updates input. The tiles logic below needs to know what is "used".
    }

    setTimeout(() => setStatus('idle'), 800);
    
    // If the hint filled the whole word, trigger success after a moment
    if (nextHintIndex === word.word.length) {
       setTimeout(() => handleCorrect(), 800);
    } else {
       // Refocus for typing
       setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const checkAnswer = (val: string) => {
    if (val.trim().toLowerCase() === word.word.toLowerCase()) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  };

  // --- TYPE MODE HANDLERS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // ENFORCE HINT LOCK: User cannot delete the hint prefix
    const correctPrefix = word.word.substring(0, hintIndex);
    if (!val.startsWith(correctPrefix)) {
      // If they try to backspace a hint, just force it back
      val = correctPrefix + val.substring(correctPrefix.length); 
      // If the resulting length is shorter than prefix (e.g. they selected all and deleted), reset to prefix
      if (val.length < correctPrefix.length) val = correctPrefix;
    }

    setInput(val);
  };

  const handleTypeSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input) return;
    checkAnswer(input);
  };

  // --- SCRAMBLE MODE HANDLERS ---

  const handleScrambleClick = (char: string, id: number) => {
    const newVal = input + char;
    setInput(newVal);
    
    // Auto check if length matches
    if (newVal.length === word.word.length) {
      checkAnswer(newVal);
    }
  };

  // Filter out letters that are already in the input (for Scramble display)
  // Note: This needs to be robust for duplicate letters.
  // We use the ID system. We hide tiles if their ID is in a "used" list? 
  // Simplified: We just filter purely based on counts or we simply rebuild the list.
  // Better approach for Mixed Mode: 
  // If we have a hint "A", and input "A", we need to hide one "A" from the scrambled buttons.
  const getVisibleScrambled = () => {
    // This is tricky with hints. Let's simplify:
    // If input is "AP", we need to hide the tiles that formed "AP".
    // But hints are auto-filled.
    // Let's just say: Show tiles that are NOT required to form the current `input`.
    
    const inputChars = input.split('').map(c => c.toLowerCase());
    const result = [...scrambledLetters]; // Copy original pool
    
    // Remove one instance of each char in input from the result pool
    for (const char of inputChars) {
      const foundIdx = result.findIndex(item => item.char.toLowerCase() === char);
      if (foundIdx !== -1) {
        result.splice(foundIdx, 1);
      }
    }
    return result;
  };

  const visibleTiles = getVisibleScrambled();

  // --- RENDER HELPERS ---

  // Generate the boxes for the word
  const renderWordBoxes = () => {
    const boxes = [];
    const len = word.word.length;
    
    for (let i = 0; i < len; i++) {
      const char = input[i] || '';
      const isHinted = i < hintIndex;
      const isCurrent = i === input.length; // The cursor position
      
      let boxStyle = "border-slate-200 bg-white text-slate-700"; // Default
      
      if (isHinted) {
        boxStyle = "border-green-400 bg-green-50 text-green-600 shadow-[0_0_10px_rgba(72,187,120,0.3)]";
      } else if (status === 'incorrect') {
        boxStyle = "border-red-400 bg-red-50 text-red-500";
      } else if (status === 'correct') {
        boxStyle = "border-green-400 bg-green-400 text-white scale-110";
      } else if (isCurrent && mode === 'TYPE') {
        boxStyle = "border-kawaii-main border-b-4 -translate-y-1";
      }

      // If it's the specific letter just revealed, animate it
      const isJustRevealed = isHinted && i === hintIndex - 1;

      boxes.push(
        <div 
          key={i} 
          className={`
            w-10 h-12 sm:w-12 sm:h-14 
            border-2 rounded-xl flex items-center justify-center 
            text-2xl font-display font-bold transition-all duration-300
            ${boxStyle}
            ${isJustRevealed ? 'animate-pop' : ''}
          `}
        >
          {char}
        </div>
      );
    }
    return boxes;
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-[8px_8px_0px_0px_rgba(93,156,236,0.15)] border-4 border-white max-w-md w-full mx-auto animate-pop relative overflow-hidden">
       
       <div className="flex justify-between items-center mb-6">
        <span className="font-display font-bold text-kawaii-text text-xl">
          {mode === 'TYPE' ? 'Spell It!' : 'Build It!'}
        </span>
        <span className="font-display font-bold text-gray-400 text-lg">{index + 1} / {total}</span>
      </div>

      <div className="flex flex-col items-center gap-8">
        
        {/* Audio Prompt */}
        <button 
          onClick={playAudio}
          disabled={isLoadingAudio}
          className="bg-kawaii-accent w-20 h-20 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-90 border-4 border-white z-10"
        >
          <Volume2 size={40} className={`text-white ${isLoadingAudio ? 'animate-spin' : ''}`} />
        </button>

        {/* Dynamic Word Boxes */}
        <div 
          className="flex flex-wrap justify-center gap-2 relative z-0 min-h-[4rem]"
          onClick={() => inputRef.current?.focus()}
        >
          {renderWordBoxes()}
          
          {/* Hidden Input for Keyboard Support */}
          {mode === 'TYPE' && (
            <input 
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              className="absolute opacity-0 top-0 left-0 w-full h-full cursor-text"
              autoComplete="off"
              autoCapitalize="off"
              autoFocus
            />
          )}
        </div>

        {/* Controls */}
        {mode === 'TYPE' ? (
          <div className="w-full">
            <p className="text-center text-slate-400 text-sm mb-4 font-bold">
              {status === 'incorrect' ? "Try again! I added a hint." : "Type the word"}
            </p>
            <Button className="w-full" onClick={() => handleTypeSubmit()} disabled={!input || status !== 'idle'}>
              Check
            </Button>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex flex-wrap justify-center gap-3 mb-6 min-h-[60px]">
              {visibleTiles.map((item, idx) => (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => handleScrambleClick(item.char, item.id)}
                  className="w-12 h-12 bg-white rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.1)] border-2 border-slate-100 text-xl font-bold text-slate-600 hover:-translate-y-1 active:translate-y-0 transition-all animate-pop"
                >
                  {item.char}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
               <Button 
                 variant="secondary" 
                 onClick={() => setInput(word.word.substring(0, hintIndex))} // Reset to just hints
                 className="flex-1 text-sm"
               >
                 <Shuffle size={16} className="mr-2"/> Clear
               </Button>
            </div>
          </div>
        )}

        {/* Feedback Icons Overlay */}
        {status === 'correct' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-white/50 backdrop-blur-sm rounded-[3rem]">
             <div className="animate-pop text-green-500 drop-shadow-lg flex flex-col items-center">
                <Check size={100} strokeWidth={5} />
                <span className="font-display font-black text-3xl">Perfect!</span>
             </div>
          </div>
        )}
         {status === 'incorrect' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
             <div className="animate-pop text-red-500 drop-shadow-lg opacity-80">
                <X size={100} strokeWidth={5} />
             </div>
          </div>
        )}

        {hintIndex > 0 && status === 'idle' && (
           <div className="absolute top-4 right-4 text-yellow-400 animate-bounce">
             <Lightbulb size={24} fill="currentColor" />
           </div>
        )}

      </div>
    </div>
  );
};
