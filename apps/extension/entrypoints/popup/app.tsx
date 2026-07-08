import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1 className="text-[3.2em] text-red-500 leading-[1.1]">WXT + React</h1>
      <div className="p-8">
        <button
          className="cursor-pointer rounded-lg border border-transparent bg-[#f9f9f9] px-[1.2em] py-[0.6em] font-medium font-sans text-base transition-colors duration-[250ms] hover:border-[#646cff] focus-visible:outline-4 focus-visible:outline-[#646cff] dark:bg-[#1a1a1a]"
          onClick={() => setCount((count) => count + 1)}
          type="button"
        >
          count is {count}
        </button>
        <p>
          Edit <code>src/app.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-[#888]">
        Click on the WXT and React logos to learn more
      </p>
    </>
  );
}

export default App;
