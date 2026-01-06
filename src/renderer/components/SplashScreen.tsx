import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [text, setText] = useState('');
  const fullText = 'Neovate';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-white">
      <div className="text-6xl font-light">
        {text}
        <span className="animate-pulse">▌</span>
      </div>
    </div>
  );
}
