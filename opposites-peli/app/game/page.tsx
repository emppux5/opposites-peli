'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
type Language = "fi" | "en";

function getCookie(name: string) {
  const cookies = document.cookie.split("; ");
  for (let c of cookies) {
    const [key, value] = c.split("=");
    if (key === name) return value;
  }
  return null;
}

function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}


const startingDelay: Record<string, number> = {
  easy: 2000,
  normal: 1500,
  hard: 1000,
};

const speedMap: Record<string, number> = {
  easy: 1500, 
  normal: 500,  
  hard: 250,    
};

const questionLabel: Record<Language, string> = {
  fi: "Mikä on sanan",
  en: "What is the opposite of",
};
const questionSuffix: Record<Language, string> = {
  fi: "vastakohta?",
  en: "?",
};

const ui: Record<Language, {
  you: string;
  bot: string;
  answer: string;
  correct: string;
  wrong: string;
  botWon: string;
  word: string;
  speed: string;
  points: string;
  record: string;
  multiplier: string;
  gameOver: string;
  result: string;
  playAgain: string;
}> = {
  fi: {
    you: "Sinä",
    bot: "Botti",
    answer: "Vastaa",
    correct: "Oikein!",
    wrong: "Väärin.",
    botWon: "Botti voitti!",
    word: "Sana",
    speed: "Nopeus",
    points: "Pisteet",
    record: "Ennätys",
    multiplier: "Kerroin",
    gameOver: "Peli loppui",
    result: "Tulos",
    playAgain: "Pelaa uudelleen",
  },
  en: {
    you: "You",
    bot: "Bot",
    answer: "Answer",
    correct: "Correct!",
    wrong: "Wrong.",
    botWon: "Bot won!",
    word: "Word",
    speed: "Speed",
    points: "Points",
    record: "Record",
    multiplier: "Multiplier",
    gameOver: "Game over",
    result: "Score",
    playAgain: "Play again",
  },
};

type WordData = Record<string, string[]>;

type GameEntry = {
  question: string;
  answers: string[];    
  botAnswer: string;    
};

export default function GamePage() {

  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [volume, setVolume] = useState(50);
  const [difficulty, setDifficulty] = useState("normal");
  const [mode, setMode] = useState("endless");

  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  const [highScore, setHighScore] = useState<number>(0);
  const [highMultiplier, setHighMultiplier] = useState<number>(1);
  const peakMultiplierRef = useRef(1);

  useEffect(() => {
    setHighScore(Number(localStorage.getItem('highScore') ?? 0));
    setHighMultiplier(Number(localStorage.getItem('highMultiplier') ?? 1));
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  const [gameData, setGameData] = useState<GameEntry[]>([]);

  useEffect(() => {
    const loadSettingsAndWords = async () => {
      const langCookie = getCookie("language");
      const vol = localStorage.getItem("volume");
      const diff = localStorage.getItem("difficulty");
      const savedMode = localStorage.getItem("mode");

      let selectedLang: Language = "en";

      if (langCookie === "fi" || langCookie === "en") {
        selectedLang = langCookie;
        setLanguage(langCookie);
      }

      if (vol) setVolume(Number(vol));
      if (diff) setDifficulty(diff.toLowerCase());
      if (savedMode) setMode(savedMode);

      const data = await import(`../../data/words.${selectedLang}.json`);
      const wordData: WordData = data.default;

      const entries = buildGameData(wordData);
      setGameData(entries);
    };

    loadSettingsAndWords();
  }, []);

  function buildGameData(wordData: WordData): GameEntry[] {
    const entries: GameEntry[] = Object.entries(wordData).map(([question, answers]) => ({
      question,
      answers,
      botAnswer: answers[Math.floor(Math.random() * answers.length)],
    }));
    return shuffleArray(entries);
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [botText, setBotText] = useState('');
  const [botIndex, setBotIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [roundOver, setRoundOver] = useState(false);
  const roundOverRef = useRef(false);

  type Status = '' | 'correct' | 'wrong' | 'botWon';
  const [status, setStatus] = useState<Status>('');

  const currentEntry = gameData[currentIndex];
  const isFinished = currentIndex >= gameData.length && gameData.length > 0;

  useEffect(() => {
    if (!isFinished) return;

    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('highScore', String(score));
    }

    const peak = peakMultiplierRef.current;
    if (peak > highMultiplier) {
      setHighMultiplier(peak);
      localStorage.setItem('highMultiplier', String(peak));
    }
  }, [isFinished]);

useEffect(() => {
  if (!currentEntry) return;

  const botAnswer = currentEntry.botAnswer;
  const wordLength = botAnswer.length;

  let baseDelay = Math.random() * startingDelay[difficulty] + 200;
  let charDelay = speedMap[difficulty];

  let iRef = { current: 0 };
  setBotText('');
  setBotIndex(0);
  roundOverRef.current = false;

  let cancelled = false;

  const typeChar = () => {
      if (cancelled || iRef.current >= wordLength) {
        if (!cancelled) {
          if (roundOverRef.current) return;
          setStatus('botWon');
          setMultiplier(1);
          setScore(prev => prev - 100);
          roundOverRef.current = true;
          setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
        }
        return;
      }

    iRef.current += 1;
    setBotText(botAnswer.slice(0, iRef.current));
    setBotIndex(iRef.current);

    setTimeout(typeChar, charDelay);
  };

  const startTimeout = setTimeout(typeChar, baseDelay);

  return () => {
    cancelled = true;
    clearTimeout(startTimeout);
  };

}, [currentEntry, difficulty]);

  useEffect(() => {
    roundOverRef.current = roundOver;
  }, [roundOver]);

  useEffect(() => {
    roundOverRef.current = false;
    setIsLocked(false);
    setStatus('');
    setUserInput('');
    setRoundOver(false);
  }, [currentIndex]);

  const dingRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    dingRef.current = new Audio("/sounds/bell.ogg");
  }, []);

  useEffect(() => {
    if (!isLocked && status !== 'botWon') {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, isLocked, status]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLocked || status === 'correct' || status === 'botWon') return;
    if (!userInput.trim()) return;
    if (!currentEntry) return;

    const trimmed = userInput.trim().toLowerCase();
    const isCorrect = currentEntry.answers.some(a => a.toLowerCase() === trimmed);

    setIsLocked(true);
    setRoundOver(true);
    roundOverRef.current = true;

    if (isCorrect) {
      setStatus('correct');
      if (dingRef.current) {
        dingRef.current.volume = volume / 100;
        dingRef.current.currentTime = 0;
        dingRef.current.play().catch(err => console.log(err));
      }

      const basePoints =
        difficulty === "normal" ? 100 :
        difficulty === "easy" ? 75 : 150;

      const gainedPoints = Math.round(basePoints * multiplier);

      setScore(prev => prev + gainedPoints);
      setMultiplier(prev => {
        const next = prev * 1.1;
        peakMultiplierRef.current = Math.max(peakMultiplierRef.current, next);
        return next;
      });

      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setUserInput('');
        setStatus('');
      }, 300);

    } else {
      setStatus('wrong');
      setMultiplier(1);
      setScore(prev => prev - 100);
      setIsLocked(false);
    }
  };

  if (isFinished) {
    const isNewHighScore = score >= highScore;
    const isNewHighMultiplier = peakMultiplierRef.current >= highMultiplier;

    return (
      <div style={{ padding: '20px', maxWidth: '420px', justifyContent: 'center', margin: '0 auto', textAlign: 'center', paddingTop: '15%' }}>
        <h1>{ui[language].gameOver}</h1>

        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc' }}>
              <th style={{ textAlign: 'left', padding: '6px 12px' }}></th>
              <th style={{ textAlign: 'right', padding: '6px 12px' }}>{ui[language].result}</th>
              <th style={{ textAlign: 'right', padding: '6px 12px' }}>{ui[language].record}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '6px 12px' }}>{ui[language].points}</td>
              <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', color: isNewHighScore ? '#c8a800' : 'inherit' }}>
                {score}{isNewHighScore ? ' 🏆' : ''}
              </td>
              <td style={{ padding: '6px 12px', textAlign: 'right', color: '#888' }}>{highScore}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 12px' }}>{ui[language].multiplier}</td>
              <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', color: isNewHighMultiplier ? '#c8a800' : 'inherit' }}>
                {peakMultiplierRef.current.toFixed(2)}x{isNewHighMultiplier ? ' 🏆' : ''}
              </td>
              <td style={{ padding: '6px 12px', textAlign: 'right', color: '#888' }}>{highMultiplier.toFixed(2)}x</td>
            </tr>
          </tbody>
        </table>

        <button onClick={() => {
          const rebuild = async () => {
            const data = await import(`../../data/words.${language}.json`);
            setGameData(buildGameData(data.default));
            setCurrentIndex(0);
            setScore(0);
            setMultiplier(1);
            peakMultiplierRef.current = 1;
          };
          rebuild();
        }}>
          {ui[language].playAgain}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '40px', padding: '20px', justifyContent: 'center' }}>

      {/* PLAYER UI */}
      <div style={{ maxWidth: '400px', paddingTop: '15%' }}>
        <h1>{ui[language].you}</h1>

        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          {questionLabel[language]} <strong>{currentEntry?.question}</strong> {questionSuffix[language]}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            disabled={isLocked || status === 'botWon'}
            onChange={(e) => {
              setUserInput(e.target.value);
              if (status === 'wrong') setStatus('');
            }}
            style={{
              padding: '8px',
              border: `2px solid ${
                status === 'correct' ? 'green' :
                status === 'wrong' ? 'red' :
                status === 'botWon' ? 'red' : '#ccc'
              }`
            }}
          />
          <button
            type="submit"
            disabled={isLocked || !userInput.trim() || status === 'botWon'}
            style={{ marginLeft: '10px', padding: '8px 16px' }}
          >
            {ui[language].answer}
          </button>
        </form>

        <div style={{ marginTop: '10px', height: '24px' }}>
          {status === 'correct' && <span style={{ color: 'green' }}>{ui[language].correct}</span>}
          {status === 'wrong' && (
            <span style={{ color: 'red' }}>
              {ui[language].wrong} ({currentEntry?.answers.join(' / ')})
            </span>
          )}
          {status === 'botWon' && (
            <span style={{ color: 'red' }}>
              {ui[language].botWon} ({currentEntry?.answers.join(' / ')})
            </span>
          )}
        </div>

        <p style={{ color: '#666', fontSize: '0.8rem' }}>
          {ui[language].word} {currentIndex + 1} / {gameData.length}
        </p>
      </div>

      {/* BOT UI */}
      <div style={{ width: '200px', paddingTop: '15%' }}>
        <h1>{ui[language].bot}</h1>

        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          {ui[language].word}: <strong>{currentEntry?.question}</strong>
        </div>

        <div
          style={{
            padding: '8px',
            border: `2px solid ${
              status === 'correct' ? 'green' :
              status === 'wrong' ? 'red' :
              status === 'botWon' ? 'red' : '#ccc'
            }`
          }}
        >
          {botText}
          <span style={{ opacity: 0.5 }}>
            {currentEntry && botIndex < currentEntry.botAnswer.length ? '|' : ''}
          </span>
        </div>

        <p style={{ color: '#666', fontSize: '0.8rem' }}>
          {ui[language].speed}: {difficulty}
        </p>
      </div>

      {/* SCORE UI */}
      <div style={{ paddingTop: '15%' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>{ui[language].points}:</strong> {score}
          <div style={{ color: '#888', fontSize: '0.8rem' }}>{ui[language].record}: {highScore}</div>
        </div>
        <div>
          <strong>{ui[language].multiplier}:</strong> {multiplier.toFixed(2)}x
          <div style={{ color: '#888', fontSize: '0.8rem' }}>{ui[language].record}: {highMultiplier.toFixed(2)}x</div>
        </div>
      </div>

    </div>
  );
}