'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from "next/navigation";
type Language = "fi" | "en";

// 🍪 GET COOKIE
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

// typing speeds (ms per character)
const startingDelay: Record<string, number> = {
  testing: 10000,
  easy: 1500,
  normal: 1250,
  hard: 1000,
};

const speedMap: Record<string, number> = {
  testing: 1000,
  easy: 350,
  normal: 300,
  hard: 250,
};

// Question label per language
const questionLabel: Record<Language, string> = {
  fi: "Mikä on sanan",
  en: "What is the opposite of",
};
const questionSuffix: Record<Language, string> = {
  fi: "vastakohta?",
  en: "?",
};

// New data shape: { word: [answer1, answer2, ...] }
type WordData = Record<string, string[]>;

// Game entry: the question word + its valid answers + the bot's chosen answer this round
type GameEntry = {
  question: string;
  answers: string[];    // all valid answers
  botAnswer: string;    // randomly picked for this round
};

export default function GamePage() {

  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [volume, setVolume] = useState(50);
  const [difficulty, setDifficulty] = useState("normal");
  const [mode, setMode] = useState("endless");

  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // 🏆 High score / high multiplier — loaded from localStorage
  const [highScore, setHighScore] = useState<number>(0);
  const [highMultiplier, setHighMultiplier] = useState<number>(1);
  const peakMultiplierRef = useRef(1);

  useEffect(() => {
    setHighScore(Number(localStorage.getItem('highScore') ?? 0));
    setHighMultiplier(Number(localStorage.getItem('highMultiplier') ?? 1));
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  // 🔹 Load settings + words
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

  // Build shuffled game entries, picking a random bot answer per entry
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

  // 🏆 Save records when game ends
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

  // BOT TYPING EFFECT
  useEffect(() => {
    if (!currentEntry) return;

    const delay = Math.random() * startingDelay[difficulty] + 100;
    const botAnswer = currentEntry.botAnswer;

    setBotText('');
    setBotIndex(0);

    let interval: NodeJS.Timeout;

    const timeout = setTimeout(() => {
      let i = 0;

      interval = setInterval(() => {
        if (roundOverRef.current) {
          clearInterval(interval);
          return;
        }

        i++;
        setBotText(botAnswer.slice(0, i));
        setBotIndex(i);

        if (i >= botAnswer.length && !roundOverRef.current) {
          setStatus('botWon');
          setMultiplier(1);
          setScore(prev => prev - 100);
          clearInterval(interval);

          setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
          }, 300);
        }
      }, speedMap[difficulty]);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [currentIndex, difficulty]);

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
    // Any valid answer counts
    const isCorrect = currentEntry.answers.some(a => a.toLowerCase() === trimmed);

    setIsLocked(true);
    setRoundOver(true);

    if (isCorrect) {
      setStatus('correct');
      if (dingRef.current) {
        dingRef.current.volume = volume / 100;
        dingRef.current.currentTime = 0;
        dingRef.current.play().catch(err => console.log(err));
      }

      const basePoints =
        difficulty === "testing" ? 0 :
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

    const basePoints =
      difficulty === "normal" ? 100 :
      difficulty === "easy" ? 75 : 150;

    const gainedPoints = Math.round(basePoints * multiplier);

    setScore(prev => prev + gainedPoints);
    setMultiplier(prev => {
      const next = prev * 1.1;
      // Track peak multiplier for this run
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

const text ={
  fi: {

  },
  en: {

  }
}

// ui ----------------------------------------------------
  if (isFinished) {
    const isNewHighScore = score >= highScore;
    const isNewHighMultiplier = peakMultiplierRef.current >= highMultiplier;

    return (
      <div style={{ padding: '20px', maxWidth: '420px',justifyContent: 'center', margin: '0 auto', textAlign: 'center',paddingTop: '15%' }}>
        <h1>Peli loppui</h1>

        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc' }}>
              <th style={{ textAlign: 'left', padding: '6px 12px' }}></th>
              <th style={{ textAlign: 'right', padding: '6px 12px' }}>Tulos</th>
              <th style={{ textAlign: 'right', padding: '6px 12px' }}>Ennätys</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '6px 12px' }}>Pisteet</td>
              <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', color: isNewHighScore ? '#c8a800' : 'inherit' }}>
                {score}{isNewHighScore ? ' 🏆' : ''}
              </td>
              <td style={{ padding: '6px 12px', textAlign: 'right', color: '#888' }}>{highScore}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 12px' }}>Kerroin</td>
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
          Pelaa uudelleen
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '40px', padding: '20px', justifyContent: 'center' }}>

      {/* PLAYER UI */}
      <div style={{ maxWidth: '400px', paddingTop: '15%' }}>
        <h1>Sinä</h1>

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
            Vastaa
          </button>
        </form>

        <div style={{ marginTop: '10px', height: '24px' }}>
          {status === 'correct' && <span style={{ color: 'green' }}>Oikein!</span>}
          {status === 'wrong' && (
            <span style={{ color: 'red' }}>
              Väärin. ({currentEntry?.answers.join(' / ')})
            </span>
          )}
          {status === 'botWon' && (
            <span style={{ color: 'red' }}>
              Botti voitti! ({currentEntry?.answers.join(' / ')})
            </span>
          )}
        </div>

        <p style={{ color: '#666', fontSize: '0.8rem' }}>
          Sana {currentIndex + 1} / {gameData.length}
        </p>
      </div>

      {/* BOT UI */}
      <div style={{ width: '200px', paddingTop: '15%' }}>
        <h1>Botti</h1>

        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          Sana: <strong>{currentEntry?.question}</strong>
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
          Nopeus: {difficulty}
        </p>
      </div>

      {/* SCORE UI */}
      <div style={{ paddingTop: '15%' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>Pisteet:</strong> {score}
          <div style={{ color: '#888', fontSize: '0.8rem' }}>Ennätys: {highScore}</div>
        </div>
        <div>
          <strong>Kerroin:</strong> {multiplier.toFixed(2)}x
          <div style={{ color: '#888', fontSize: '0.8rem' }}>Ennätys: {highMultiplier.toFixed(2)}x</div>
        </div>
      </div>

    </div>
  );
// ui loppu ----------------------------------------------------
}
