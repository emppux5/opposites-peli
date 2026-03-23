'use client';
import { useState, useEffect, useRef} from 'react';
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
  normal: 1000,
  hard: 500,
};

const speedMap: Record<string, number> = {
  easy: 300,
  normal: 200,
  hard: 100,
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
  const [words, setWords] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔹 LUE asetukset
  useEffect(() => {
  const loadSettingsAndWords = async () => {
    const langCookie = getCookie("language");
    const vol = localStorage.getItem("volume");
    const diff = localStorage.getItem("difficulty");

    let selectedLang: Language = "en";

    if (langCookie === "fi" || langCookie === "en") {
      selectedLang = langCookie;
      setLanguage(langCookie);
    }

    if (vol) setVolume(Number(vol));
    if (diff) setDifficulty(diff.toLowerCase());

    // ✅ load words AFTER language is known
    const data = await import(`../../data/words.${selectedLang}.json`);
    setWords(data.default);
  };

  loadSettingsAndWords();
}, []);

  // const gameData = Object.entries(words) as [string, string][];
  const [gameData, setGameData] = useState<[string, string][]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [botText, setBotText] = useState('');
  const [botIndex, setBotIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [roundOver, setRoundOver] = useState(false);

  type Status = '' | 'correct' | 'wrong' | 'botWon';
  const [status, setStatus] = useState<Status>('');
  
  const currentPair = gameData[currentIndex];

  const question = isFlipped ? currentPair?.[1] : currentPair?.[0];
  const answer = isFlipped ? currentPair?.[0] : currentPair?.[1];
  const isFinished = currentIndex >= gameData.length;


  useEffect(() => {
      if (!words) return;
      const entries = Object.entries(words) as [string, string][];
      setGameData(shuffleArray(entries));
    }, [words]);
 
  useEffect(() => {
    setIsFlipped(Math.random() < 0.5);
  }, [currentIndex]);

  // BOT TYPING EFFECT
useEffect(() => {
  if (!currentPair){
    console.log("aksjdhflkasjdf")
    return;
  }
  const delay = Math.random() * startingDelay[difficulty];
  const answer = isFlipped ? currentPair[0] : currentPair[1];

  setBotText('');
  setBotIndex(0);

  let interval: NodeJS.Timeout;

  const timeout = setTimeout(() => {
    let i = 0;

    interval = setInterval(() => {
      if (roundOver) {
        clearInterval(interval);
        return;
      }

      i++;
      setBotText(answer.slice(0, i));
      setBotIndex(i);

      if (i >= answer.length && !roundOver) {
        console.log("LOSER BOT WINS");
        setStatus('botWon');

        setMultiplier(1); 
        setScore(prev => prev - 100);

        clearInterval(interval);

        // ⏭️ Move to next word after delay
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
}, [currentIndex, isFlipped]);

useEffect(() => {
  setIsLocked(false);
  setStatus('');
  setUserInput('');
  setRoundOver(false); 
}, [currentIndex]);

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

  // 🚫 Block if already answered or locked
  if (isLocked || status === 'correct' || status === 'botWon') return;

  // 🚫 Block empty input
  if (!userInput.trim()) return;

  if (!currentPair) return;

  const answer = isFlipped ? currentPair[0] : currentPair[1];

  // 🔒 Lock immediately to prevent spam
  setIsLocked(true);
  setRoundOver(true);

  if (userInput.trim().toLowerCase() === answer.toLowerCase()) {
    setStatus('correct');

    const basePoints =
      difficulty === "normal" ? 100 :
      difficulty === "easy" ? 75 : 150;

    const gainedPoints = Math.round(basePoints * multiplier);

    setScore(prev => prev + gainedPoints);
    setMultiplier(prev => prev * 1.01);

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setStatus('');
    }, 300);

  } else {
    setStatus('wrong');

    setMultiplier(1);
    setScore(prev => prev - 100);

    // 🔓 Allow retry after wrong answer (optional design choice)
    setIsLocked(false);
  }
};

  if (isFinished) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Peli loppui</h1>
        <button onClick={() => {
            const entries = Object.entries(words) as [string, string][];
            setGameData(shuffleArray(entries));
            setCurrentIndex(0);
          }}>
          Pelaa uudelleen
        </button>
<h2>Pisteet:</h2> {score}
<div>
<strong>Kerroin:</strong> {multiplier.toFixed(2)}x
</div>
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
            ref = {inputRef} 
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
            {botIndex < answer.length ? '|' : ''}
          </span>
        </div>

        <p style={{ color: '#666', fontSize: '0.8rem' }}>
          Nopeus: {difficulty}
        </p>
      </div>
      <div style={{ marginTop: '10px' }}>
  <strong>Pisteet:</strong> {score}
</div>

<div>
  <strong>Kerroin:</strong> {multiplier.toFixed(2)}x
</div>

    </div>
  );
}