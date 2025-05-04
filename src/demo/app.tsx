import { useState } from 'react';

import './app.css';

import useTrailingAsync from '../index';

export default function App() {
  const [text, setText] = useState('');
  const [executionCount, setExecutionCount] = useState(0);

  const incrementExecutionCount = () => {
    setExecutionCount((prev) => prev + 1);
  };

  const {
    execute: countCharacters,
    isProcessing,
    result,
  } = useTrailingAsync(async (text: string) => {
    incrementExecutionCount();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return text.length;
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    void countCharacters(newText);
  };

  return (
    <>
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Type something…"
        rows={5}
      />
      <div>
        {isProcessing ? (
          <p>Slowly counting characters…</p>
        ) : (
          <p>Character count: {result}</p>
        )}
        <p>Executions: {executionCount}</p>
      </div>
    </>
  );
}
