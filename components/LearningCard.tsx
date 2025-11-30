import React from 'react';
import { Word } from '../types';
import { Button } from './Button';
import { Volume2, SkipForward } from 'lucide-react';

interface LearningCardProps {
  word: Word;
  onNext: () => void;
  index: number;
  total: number;
  playAudio: () => void;
  isLoadingAudio: boolean;
  onSkip?: () => void;
  isSkipping?: boolean;
}

export const LearningCard: React.FC<LearningCardProps> = ({ 
  word, 
  onNext, 
  index, 
  total,
  playAudio,
  isLoadingAudio,
  onSkip,
  isSkipping
}) => {
  
  React.useEffect(() => {
    playAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-[8px_8px_0px_0px_rgba(93,156,236,0.15)] border-4 border-white max-w-md w-full mx-auto animate-pop relative overflow-hidden">
      
      {/* Progress Indicator */}
      <div className="absolute top-6 right-6 font-display font-bold text-kawaii-text text-xl">
        {index + 1} / {total}
      </div>

      <div className="flex flex-col items-center gap-6 mt-4">
        {/* Word Display */}
        <div className="relative">
          <h2 className="text-5xl font-display font-bold text-kawaii-text mb-2 text-center break-words">
            {word.word}
          </h2>
          <div className="bg-kawaii-sub/40 absolute -bottom-2 left-0 w-full h-4 -z-10 rounded-full"></div>
        </div>

        {/* Phonetic */}
        <button 
          className="flex items-center gap-2 bg-kawaii-bg px-5 py-3 rounded-full cursor-pointer hover:scale-105 transition-transform active:scale-95" 
          onClick={playAudio}
          disabled={isLoadingAudio}
        >
          <span className="text-kawaii-text font-mono text-lg">{word.phonetic}</span>
          <Volume2 size={24} className={`text-kawaii-main ${isLoadingAudio ? 'animate-pulse opacity-50' : ''}`} />
        </button>

        {/* Definition */}
        <div className="w-full bg-blue-50 p-6 rounded-3xl border-2 border-blue-100">
          <h3 className="text-sm uppercase tracking-wider font-bold text-blue-400 mb-2">Definition</h3>
          <p className="text-lg text-slate-700 leading-relaxed font-sans">{word.definition}</p>
        </div>

        {/* Example */}
        <div className="w-full bg-yellow-50 p-6 rounded-3xl border-2 border-yellow-100">
          <h3 className="text-sm uppercase tracking-wider font-bold text-yellow-500 mb-2">Example</h3>
          <p className="text-lg text-slate-700 leading-relaxed italic">"{word.example}"</p>
        </div>

        <div className="w-full flex gap-3 mt-4">
          {onSkip && (
            <button 
              onClick={onSkip} 
              disabled={isSkipping}
              className="flex items-center justify-center p-4 rounded-2xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Skip this word"
            >
              {isSkipping ? <span className="animate-spin">⏳</span> : <SkipForward size={24} />}
            </button>
          )}
          <Button onClick={onNext} size="lg" className="shadow-lg shadow-blue-200 flex-1">
            I Remember! Test Me! ✨
          </Button>
        </div>
      </div>
    </div>
  );
};
