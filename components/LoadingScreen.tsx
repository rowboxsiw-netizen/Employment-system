
import React from 'react';
import { Sparkles } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
      <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center animate-bounce shadow-2xl shadow-indigo-500/50">
        <Sparkles className="text-white w-10 h-10" />
      </div>
      <h2 className="text-white font-bold text-2xl mt-8 tracking-widest">NEXUS EMS</h2>
      <div className="mt-4 flex gap-1">
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-100"></div>
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-200"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
