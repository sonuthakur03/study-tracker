import React from 'react';
import { BookOpen } from 'lucide-react';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BookOpen size={20} className="text-white" />
          </div>
          <div className="text-white">
            <p className="font-bold text-lg leading-none">StudyTrack</p>
            <p className="text-xs text-indigo-300">Nepal 🇳🇵</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
          <p className="text-slate-500 text-sm mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
