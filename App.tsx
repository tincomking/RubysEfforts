
import React, { useState, useEffect, useRef } from 'react';
import { generateDailyWords, getPronunciation } from './services/geminiService';
import { Word, UserProgress, AppState, DailyRecord } from './types';
import { LearningCard } from './components/LearningCard';
import { SpellingCard } from './components/SpellingCard';
import { QuizCard } from './components/QuizCard';
import { Button } from './components/Button';
import { Logo } from './components/Logo';
import { Calendar, Trophy, BookOpen, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'rubys_efforts_v2';

const getDayString = () => new Date().toISOString().split('T')[0];

const INITIAL_PROGRESS: UserProgress = {
  streak: 0,
  lastLoginDate: '',
  history: [],
  totalWordsLearned: 0
};

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(INITIAL_PROGRESS);
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [todaysWords, setTodaysWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Audio State
  const [audioCache, setAudioCache] = useState<Record<string, AudioBuffer>>({});
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Weekly Test State
  const [isFridayTest, setIsFridayTest] = useState(false);
  const [testWords, setTestWords] = useState<Word[]>([]);
  
  // Skipping State
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    // Init Audio Context (lazy init is better, but we prepare the ref)
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtor) {
      audioContextRef.current = new AudioCtor({ sampleRate: 24000 });
    }
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const currentProgress: UserProgress = stored ? JSON.parse(stored) : INITIAL_PROGRESS;
      setProgress(currentProgress);

      const today = getDayString();
      const todayRecord = currentProgress.history.find(h => h.date === today);

      if (todayRecord) {
        setTodaysWords(todayRecord.words);
        if (todayRecord.completed) {
           const dayOfWeek = new Date().getDay();
           if (dayOfWeek === 5) { 
              setAppState(AppState.HOME); 
           } else {
              setAppState(AppState.COMPLETED);
           }
        } else {
          setAppState(AppState.HOME);
        }
      } else {
        await startNewDay(currentProgress);
      }
    } catch (e) {
      console.error("Failed to load", e);
      setErrorMsg("Failed to load profile.");
      setAppState(AppState.ERROR);
    }
  };

  const startNewDay = async (currentProgress: UserProgress) => {
    setAppState(AppState.LOADING);
    const existingWords = currentProgress.history.flatMap(h => h.words.map(w => w.word));
    
    try {
      const newWords = await generateDailyWords(existingWords, 10);
      const today = getDayString();
      
      const newRecord: DailyRecord = {
        date: today,
        words: newWords,
        completed: false
      };

      const updatedProgress = {
        ...currentProgress,
        history: [...currentProgress.history, newRecord]
      };

      saveProgress(updatedProgress);
      setTodaysWords(newWords);
      setAppState(AppState.HOME);
    } catch (e) {
      setErrorMsg("Could not generate words. Please check your connection.");
      setAppState(AppState.ERROR);
    }
  };

  const saveProgress = (newProgress: UserProgress) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
    setProgress(newProgress);
  };

  // --- AUDIO LOGIC ---
  const playWordAudio = async (wordText: string) => {
    // 0. Stop current audio if playing
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch(e) {}
      activeSourceRef.current = null;
    }

    // 1. Ensure AudioContext is running
    if (!audioContextRef.current) {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtor({ sampleRate: 24000 });
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // 2. Check Cache
    if (audioCache[wordText]) {
      playBuffer(audioCache[wordText]);
      return;
    }

    setIsLoadingAudio(true);
    const base64 = await getPronunciation(wordText);
    setIsLoadingAudio(false);

    if (base64) {
      try {
         // 3. Decode Raw PCM
         // Convert Base64 string to ArrayBuffer safely
         const binaryString = atob(base64);
         const len = binaryString.length;
         
         // Ensure buffer length is even for Int16Array
         const safeLen = len % 2 === 0 ? len : len - 1;
         
         const buffer = new ArrayBuffer(safeLen);
         const view = new Uint8Array(buffer);
         for (let i = 0; i < safeLen; i++) {
           view[i] = binaryString.charCodeAt(i);
         }
         
         const pcm16 = new Int16Array(buffer);
         const audioBuffer = audioContextRef.current.createBuffer(1, pcm16.length, 24000);
         const channelData = audioBuffer.getChannelData(0);
         
         for (let i = 0; i < pcm16.length; i++) {
           // Convert Int16 to Float32 [-1.0, 1.0]
           channelData[i] = pcm16[i] / 32768.0;
         }

         setAudioCache(prev => ({...prev, [wordText]: audioBuffer}));
         playBuffer(audioBuffer);

      } catch (e) {
        console.error("Audio Play Error", e);
      }
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
    
    activeSourceRef.current = source;
    source.onended = () => {
      if (activeSourceRef.current === source) {
        activeSourceRef.current = null;
      }
    };
  };


  // --- FLOW HANDLERS ---

  const handleStartDaily = () => {
    setCurrentIndex(0);
    setIsFridayTest(false);
    setAppState(AppState.LEARNING);
  };

  const handleStartWeeklyTest = () => {
    const allWords = progress.history.flatMap(h => h.words);
    const shuffled = [...allWords].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 15);
    
    if (selected.length === 0) {
      alert("Not enough words learned yet for a test!");
      return;
    }

    setTestWords(selected);
    setCurrentIndex(0);
    setIsFridayTest(true);
    setAppState(AppState.SPELLING); // Test starts directly with spelling
  };

  // Phase 1: Learning Card -> I Remember
  const handleLearningNext = () => {
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch(e) {}
    }
    setAppState(AppState.SPELLING);
  };

  const handleSkipWord = async () => {
    setIsSkipping(true);
    try {
      // Fetch 1 new word
      const currentSessionWords = todaysWords.map(w => w.word);
      const allExisting = [...progress.history.flatMap(h => h.words.map(w => w.word)), ...currentSessionWords];
      
      const newWords = await generateDailyWords(allExisting, 1);
      if (newWords.length > 0) {
        setTodaysWords(prev => {
          const updated = [...prev];
          // Replace current word logic:
          // Actually, if we remove the word at currentIndex, the next word slides into currentIndex.
          // But we want to maintain the "10 words" count. 
          // So we remove the current one and add the new one to the end of the queue.
          // This way, the user effectively "skips" to the next available word, and the new word appears later.
          updated.splice(currentIndex, 1);
          updated.push(newWords[0]);
          return updated;
        });
        // Note: currentIndex remains the same, but it now points to what was previously 'next' word.
        // If we were at the last word, the new word is at the same index (or last index).
      }
    } catch (e) {
      console.error("Skip failed", e);
      alert("Oops! Couldn't skip right now.");
    } finally {
      setIsSkipping(false);
    }
  };

  // Phase 2: Spelling -> Quiz
  const handleSpellingCorrect = () => {
     setAppState(AppState.QUIZ);
  };

  // Phase 3: Quiz -> Next Word or Finish
  const handleQuizCorrect = () => {
    const activeList = isFridayTest ? testWords : todaysWords;
    
    // Add delay for celebration animation
    setTimeout(() => {
      if (currentIndex < activeList.length - 1) {
        setCurrentIndex(prev => prev + 1);
        if (isFridayTest) {
          setAppState(AppState.SPELLING);
        } else {
          setAppState(AppState.LEARNING);
        }
      } else {
        completeSession();
      }
    }, 500); // Small delay to allow component to unmount cleanly after celebration
  };

  const completeSession = () => {
    if (isFridayTest) {
      setAppState(AppState.COMPLETED);
      return;
    }

    const today = getDayString();
    const updatedHistory = progress.history.map(h => {
      if (h.date === today) {
        return { ...h, words: todaysWords, completed: true }; // Save final list in case skips happened
      }
      return h;
    });

    let newStreak = progress.streak;
    if (progress.lastLoginDate) {
      const lastDate = new Date(progress.lastLoginDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const updatedProgress: UserProgress = {
      ...progress,
      streak: newStreak,
      lastLoginDate: today,
      history: updatedHistory,
      totalWordsLearned: progress.totalWordsLearned + todaysWords.length
    };

    saveProgress(updatedProgress);
    setAppState(AppState.COMPLETED);
  };

  // Render Helpers
  const isTodayCompleted = progress.history.find(h => h.date === getDayString())?.completed;
  const isFriday = new Date().getDay() === 5;
  
  const currentWord = isFridayTest ? testWords[currentIndex] : todaysWords[currentIndex];
  const totalWords = isFridayTest ? testWords.length : todaysWords.length;

  if (appState === AppState.LOADING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="animate-bounce mb-6">
           <Logo size={80} />
        </div>
        <h2 className="text-2xl font-display font-bold text-kawaii-main animate-pulse">
          Preparing your mission...
        </h2>
      </div>
    );
  }

  if (appState === AppState.ERROR) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">😿</div>
        <p className="text-xl text-red-500 font-bold mb-4">{errorMsg}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 relative overflow-x-hidden">
      {/* Header */}
      <header className="pt-8 pb-4 px-6 flex justify-between items-center max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Logo size={50} />
          <h1 className="text-2xl font-display font-bold text-slate-700 tracking-tight">Ruby's Efforts</h1>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border-2 border-blue-100">
          <span className="text-2xl">🔥</span>
          <span className="font-bold text-kawaii-main text-lg">{progress.streak}</span>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-2xl">
        
        {/* HOME STATE */}
        {appState === AppState.HOME && (
          <div className="flex flex-col gap-6 animate-slide-up">
            {/* Welcome Card */}
            <div className="bg-white rounded-[2rem] p-8 border-4 border-kawaii-sub/30 shadow-lg text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-4 bg-kawaii-sub/30"></div>
              <h2 className="text-3xl font-display font-bold text-slate-700 mb-2">
                {isTodayCompleted ? "Great job, Ruby! 🎉" : "Ready for today?"}
              </h2>
              <p className="text-slate-500 mb-6 font-medium">
                {isTodayCompleted 
                  ? "You've crushed today's goals. Come back tomorrow!" 
                  : "10 new advanced words are waiting for you."}
              </p>
              
              {!isTodayCompleted ? (
                <Button onClick={handleStartDaily} size="lg" className="w-full shadow-lg hover:-translate-y-1">
                  Start Daily Training 🚀
                </Button>
              ) : (
                <div className="bg-green-50 text-green-600 font-bold py-3 px-6 rounded-xl inline-block border-2 border-green-200">
                  Daily Check-in Complete ✅
                </div>
              )}
            </div>

            {/* Friday Special */}
            {isFriday && (
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                  <Trophy size={120} />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">Weekly Boss Battle</h3>
                <p className="text-purple-100 mb-6 max-w-xs">
                  It's Friday! Test your knowledge on words from this week.
                </p>
                <Button 
                  onClick={handleStartWeeklyTest} 
                  className="bg-white text-purple-600 border-b-purple-800 hover:bg-purple-50 w-full"
                >
                  Start Weekly Test ⚔️
                </Button>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border-2 border-white shadow-sm flex flex-col items-center">
                <BookOpen className="text-kawaii-main mb-2" size={32} />
                <span className="text-3xl font-bold text-slate-700">{progress.totalWordsLearned}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Words Learned</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border-2 border-white shadow-sm flex flex-col items-center">
                <Calendar className="text-kawaii-sub mb-2" size={32} />
                <span className="text-3xl font-bold text-slate-700">{progress.history.length}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Days Active</span>
              </div>
            </div>
          </div>
        )}

        {/* LEARNING STATE */}
        {appState === AppState.LEARNING && (
          <div className="flex flex-col h-full">
            <div className="mb-6 flex justify-between items-center px-4">
               <button onClick={() => setAppState(AppState.HOME)} className="text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1">
                 <RotateCcw size={16}/> Quit
               </button>
               <span className="font-bold text-kawaii-main uppercase tracking-widest text-sm">Learning Phase</span>
            </div>
            <LearningCard 
              word={currentWord} 
              index={currentIndex} 
              total={totalWords} 
              onNext={handleLearningNext}
              playAudio={() => playWordAudio(currentWord.word)}
              isLoadingAudio={isLoadingAudio}
              onSkip={!isFridayTest ? handleSkipWord : undefined}
              isSkipping={isSkipping}
            />
          </div>
        )}

        {/* SPELLING STATE */}
        {appState === AppState.SPELLING && (
          <div className="flex flex-col h-full">
            <div className="mb-6 flex justify-between items-center px-4">
               <button onClick={() => setAppState(AppState.HOME)} className="text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1">
                 <RotateCcw size={16}/> Quit
               </button>
               <span className="font-bold text-purple-500 uppercase tracking-widest text-sm">
                 Active Recall Phase
               </span>
            </div>
            <SpellingCard 
              word={currentWord}
              index={currentIndex}
              total={totalWords}
              onCorrect={handleSpellingCorrect}
              playAudio={() => playWordAudio(currentWord.word)}
              isLoadingAudio={isLoadingAudio}
            />
          </div>
        )}

         {/* QUIZ STATE */}
         {appState === AppState.QUIZ && (
          <div className="flex flex-col h-full">
            <div className="mb-6 flex justify-between items-center px-4">
               <button onClick={() => setAppState(AppState.HOME)} className="text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1">
                 <RotateCcw size={16}/> Quit
               </button>
               <span className="font-bold text-orange-500 uppercase tracking-widest text-sm">
                 Context Phase
               </span>
            </div>
            <QuizCard 
              word={currentWord}
              index={currentIndex}
              total={totalWords}
              onCorrect={handleQuizCorrect}
            />
          </div>
        )}

        {/* COMPLETED STATE */}
        {appState === AppState.COMPLETED && (
          <div className="text-center animate-pop pt-10">
            <div className="mb-6 animate-bounce-short flex justify-center">
              <Logo size={120} />
            </div>
            <h2 className="text-4xl font-display font-bold text-kawaii-main mb-4">
              {isFridayTest ? "Weekly Boss Defeated!" : "Mission Accomplished!"}
            </h2>
            <p className="text-xl text-slate-600 mb-8 font-medium">
              {isFridayTest 
                ? "Your memory is amazing! See you next week."
                : "You've mastered 10 new words today. Ruby is getting smarter!"}
            </p>
            
            <div className="bg-white p-6 rounded-3xl inline-block shadow-lg border-4 border-yellow-200 mb-8 transform rotate-2">
              <span className="block text-sm text-yellow-500 font-bold uppercase">XP Gained</span>
              <span className="text-5xl font-black text-yellow-400">
                {isFridayTest ? "+500" : "+100"}
              </span>
            </div>

            <div className="w-full">
              <Button onClick={() => setAppState(AppState.HOME)} size="lg" variant="secondary">
                Return Home
              </Button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
