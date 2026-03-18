import { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/20/solid';

export function Guess() {
  const [guess, setGuess] = useState('');

  function handleSend() {
    if (guess.trim()) {
      console.log('Guess submitted:', guess);
      setGuess('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSend();
    }
  }

  return (
    <div className="h-full bg-gray-100 rounded-sm p-4 flex flex-col">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Send your guesses</h2>
      <div className="flex-1 overflow-y-auto space-y-2">
        <div className="bg-white p-2 rounded-sm text-sm text-gray-600">
          <span className="font-medium text-gray-800">Alex:</span> Hello!
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your guess..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-emerland-900 text-sm"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-emerald-900 text-white rounded-sm hover:bg-emerland-400 transition-colors flex items-center"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div >
  );
}
