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
  easy: 1500,
  normal: 1250,
  hard: 1000,
};

const speedMap: Record<string, number> = {
  easy: 300,
  normal: 250,
  hard: 200,
};

const difficultyMultipliers: Record<string, number> = {
  easy: 0.8,
  normal: 1,
  hard: 1.2,
};


export default function GamePage() {

  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [volume, setVolume] = useState(50);
  const [difficulty, setDifficulty] = useState("normal");
  const [mode, setMode] = useState("endless");

  const [words, setWords] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // 🏆 High score / high multiplier — loaded from localStorage
  const [highScore, setHighScore] = useState<number>(0);
  const [highMultiplier, setHighMultiplier] = useState<number>(1);
  // Peak multiplier reached during the current run
  const peakMultiplierRef = useRef(1);

  useEffect(() => {
    setHighScore(Number(localStorage.getItem('highScore') ?? 0));
    setHighMultiplier(Number(localStorage.getItem('highMultiplier') ?? 1));
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  // 🔹 LUE asetukset
  useEffect(() => {
  const loadSettingsAndWords = async () => {
    const langCookie = getCookie("language");
    const vol = localStorage.getItem("volume");
    const diff = localStorage.getItem("difficulty");
    const mode = localStorage.getItem("mode"); // joko, peli jatkuu loputtomiin tai loppuu siihen että botti voittaa kerran

    let selectedLang: Language = "en";

    if (langCookie === "fi" || langCookie === "en") {
      selectedLang = langCookie;
      setLanguage(langCookie);
    }

    if (vol) setVolume(Number(vol));
    if (diff) setDifficulty(diff.toLowerCase());

    const data = await import(`../../data/words.${selectedLang}.json`);
    setWords(data.default);
  };

  loadSettingsAndWords();
}, []);

  const [gameData, setGameData] = useState<[string, string][]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [botText, setBotText] = useState('');
  const [botIndex, setBotIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [roundOver, setRoundOver] = useState(false);
  const roundOverRef = useRef(false);

  // ✅ Stable flip state per index — computed synchronously, never stale
  const flipStates = useRef<Record<number, boolean>>({});
  const isFlipped = useMemo(() => {
    if (flipStates.current[currentIndex] === undefined) {
      flipStates.current[currentIndex] = Math.random() < 0.5;
    }
    return flipStates.current[currentIndex];
  }, [currentIndex]);

  type Status = '' | 'correct' | 'wrong' | 'botWon';
  const [status, setStatus] = useState<Status>('');
  
  const currentPair = gameData[currentIndex];

  const question = isFlipped ? currentPair?.[1] : currentPair?.[0];
  const answer = isFlipped ? currentPair?.[0] : currentPair?.[1];
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

  useEffect(() => {
      if (!words) return;
      const entries = Object.entries(words) as [string, string][];
      setGameData(shuffleArray(entries));
    }, [words]);
 
  // BOT TYPING EFFECT
useEffect(() => {
  if (!currentPair) return;

  const delay = Math.random() * startingDelay[difficulty];
  const botAnswer = isFlipped ? currentPair[0] : currentPair[1];

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
}, [currentIndex, isFlipped, difficulty]);

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
  if (!currentPair) return;

  const correctAnswer = isFlipped ? currentPair[0] : currentPair[1];

  setIsLocked(true);
  setRoundOver(true);

  if (userInput.trim().toLowerCase() === correctAnswer.toLowerCase()) {
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

  if (isFinished) {
    const isNewHighScore = score >= highScore;
    const isNewHighMultiplier = peakMultiplierRef.current >= highMultiplier;

    return (
      <div style={{ padding: '20px', maxWidth: '420px' }}>
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
            const entries = Object.entries(words) as [string, string][];
            setGameData(shuffleArray(entries));
            setCurrentIndex(0);
            setScore(0);
            setMultiplier(1);
            peakMultiplierRef.current = 1;
            flipStates.current = {};
          }}>
          Pelaa uudelleen
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '40px', padding: '20px' , justifyContent: 'center'}}>
      
      {/* PLAYER UI */}
      <div style={{ maxWidth: '400px', paddingTop: '15%' }}>
        <h1>Sinä</h1>

        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          Mikä on sanan <strong>{question}</strong> vastakohta?
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
                status === 'correct' ? 'green' : status === 'wrong' ? 'red' : status === 'botWon' ? 'red' : '#ccc'
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
          {status === 'wrong' && <span style={{ color: 'red' }}>Väärin.</span>}
          {status === 'botWon' && <span style={{ color: 'red' }}>Botti voitti!</span>}
        </div>

        <p style={{ color: '#666', fontSize: '0.8rem' }}>
          Sana {currentIndex + 1} / {gameData.length}
        </p>
      </div>

      {/* BOT UI */}
      <div style={{ width: '200px', paddingTop: '15%' }}>
        <h1>Botti</h1>

        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          Sana: <strong>{question}</strong>
        </div>

        <div
            style={{ 
              padding: '8px', 
              border: `2px solid ${
                status === 'correct' ? 'green' : status === 'wrong' ? 'red' : status === 'botWon' ? 'red': '#ccc'
              }`
            }}
        >
          {botText}
          <span style={{ opacity: 0.5 }}>
            {answer && botIndex < answer.length ? '|' : ''}
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
}
