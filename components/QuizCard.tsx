import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { Button } from './Button';
import { CheckCircle2, AlertCircle, Stars } from 'lucide-react';

interface QuizCardProps {
  word: Word;
  onCorrect: () => void;
  index: number;
  total: number;
}

export const QuizCard: React.FC<QuizCardProps> = ({ word, onCorrect, index, total }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isWrong, setIsWrong] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Shuffle options on mount
    const opts = [...word.options].sort(() => Math.random() - 0.5);
    setShuffledOptions(opts);
    setSelectedOption(null);
    setIsWrong(false);
    setShowCelebration(false);
  }, [word]);

  const handleSelect = (option: string) => {
    setSelectedOption(option);
    
    // Normalize comparison to prevent case/space issues
    const isMatch = option.trim().toLowerCase() === word.word.trim().toLowerCase();

    if (isMatch) {
      // Correct
      const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/arrow.mp3'); 
      audio.volume = 0.5;
      audio.play().catch(() => {});

      setShowCelebration(true);

      // Pass control back to App after animation
      setTimeout(() => {
        onCorrect();
      }, 2000);
    } else {
      // Incorrect
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 800);
    }
  };

  // Split sentence by underscores to highlight the blank
  const parts = word.quiz_sentence.split('_______');

  return (
    <>
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-pop">
           <div className="bg-white p-12 rounded-[3rem] text-center border-8 border-yellow-300 shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-yellow-50 opacity-50 bg-[radial-gradient(#ffd700_20%,transparent_20%)] bg-[length:20px_20px]"></div>
             <div className="relative z-10">
               <Stars className="w-24 h-24 text-yellow-400 mx-auto mb-4 animate-bounce" />
               <h2 className="text-6xl font-display font-black text-kawaii-main mb-2 animate-wiggle">CORRECT!</h2>
               <p className="text-2xl text-slate-500 font-bold">Amazing Job! 🎉</p>
             </div>
           </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-[3rem] shadow-[8px_8px_0px_0px_rgba(93,156,236,0.15)] border-4 border-white max-w-md w-full mx-auto animate-pop relative">
        
        <div className="flex justify-between items-center mb-6">
          <span className="font-display font-bold text-kawaii-text text-xl">Fill the Blank</span>
          <span className="font-display font-bold text-gray-400 text-lg">{index + 1} / {total}</span>
        </div>

        <div className="flex flex-col gap-6">
          {/* Sentence Display */}
          <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 text-center min-h-[120px] flex items-center justify-center">
            <p className="text-xl text-slate-700 leading-relaxed font-medium">
              {parts[0]}
              <span className={`inline-block border-b-4 px-2 min-w-[80px] font-bold ${showCelebration ? 'text-green-600 border-green-500 scale-110' : 'text-transparent border-kawaii-main'} transition-all duration-300`}>
                {selectedOption && selectedOption.trim().toLowerCase() === word.word.trim().toLowerCase() ? word.word : '____'}
              </span>
              {parts.length > 1 ? parts[1] : ''}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3">
            {shuffledOptions.map((opt, i) => {
              const isMatch = opt.trim().toLowerCase() === word.word.trim().toLowerCase();
              const isSelected = selectedOption === opt;
              
              let btnVariant: 'primary' | 'secondary' | 'danger' | 'success' = 'secondary';
              if (isSelected) {
                if (isMatch) btnVariant = 'success';
                else btnVariant = 'danger';
              }

              // If celebration is showing, highlight the correct one
              if (showCelebration && isMatch) {
                btnVariant = 'success';
              }

              return (
                <Button
                  key={i}
                  variant={btnVariant}
                  onClick={() => handleSelect(opt)}
                  className={`w-full py-4 text-lg ${isSelected && !isMatch ? 'animate-wiggle' : ''}`}
                  disabled={showCelebration || (selectedOption !== null && selectedOption === word.word)} // Lock UI
                >
                  {opt}
                  {(isSelected || showCelebration) && isMatch && <CheckCircle2 className="ml-2" />}
                  {isSelected && !isMatch && <AlertCircle className="ml-2" />}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
