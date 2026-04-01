"use client";

import { useState } from "react";

interface Props {
  onSave: (username: string) => void;
}

export default function UsernamePrompt({ onSave }: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length >= 1) onSave(trimmed);
  };

  return (
    <div className="t-username-prompt-backdrop fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4">
      <div className="t-username-prompt-card bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="t-username-prompt-header text-center mb-6">
          <div className="t-username-prompt-icon text-4xl mb-3">🎯</div>
          <h1 className="t-username-prompt-title text-2xl font-bold text-gray-900">Welcome to Goal Tracker</h1>
          <p className="t-username-prompt-subtitle text-gray-500 mt-1 text-sm">Enter a username to get started</p>
        </div>
        <form onSubmit={handleSubmit} className="t-username-prompt-form space-y-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Your name…"
            className="t-username-prompt-input w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
            autoFocus
            maxLength={32}
          />
          <button
            type="submit"
            disabled={input.trim().length === 0}
            className="t-username-prompt-submit w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}
