import { useState } from "react";
import { ThreeBodyScene } from "./components/ThreeBodyScene";
import { LandingPage } from "./components/LandingPage";

function App() {
  const [started, setStarted] = useState(false);

  if (started) {
    return (
      <div className="w-full h-screen relative overflow-hidden">
        <button
          onClick={() => setStarted(false)}
          className="absolute bottom-24 right-4 z-50 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded backdrop-blur-sm transition-colors border border-white/20 text-sm font-medium"
        >
          Exit Simulation
        </button>
        <ThreeBodyScene />
      </div>
    );
  }

  return <LandingPage onStart={() => setStarted(true)} />;
}

export default App;
