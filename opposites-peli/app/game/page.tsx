'use client';
import { useState, useEffect } from 'react';
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


export default function GamePage() {

  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [volume, setVolume] = useState(50);
  const [difficulty, setDifficulty] = useState("normal");
  const [words, setWords] = useState<Record<string, string>>({});

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
      i++;
      setBotText(answer.slice(0, i));
      setBotIndex(i);

      if (i >= answer.length) {
        console.log("LOSER BOT WINS");
        setStatus('botWon');
        clearInterval(interval);
      }
    }, speedMap[difficulty]);
  }, delay);

  return () => {
    clearTimeout(timeout);
    if (interval) clearInterval(interval);
  };
}, [currentIndex, isFlipped]);

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!currentPair) return;

  const answer = isFlipped ? currentPair[0] : currentPair[1];

  if (userInput.trim().toLowerCase() === answer.toLowerCase()) {
    setStatus('correct');

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setStatus('');
    }, 300);
  } else {
    setStatus('wrong');
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
            autoFocus
            type="text" 
            value={userInput} 
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
          <button type="submit" style={{ marginLeft: '10px', padding: '8px 16px' }}>
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

    </div>
  );
}