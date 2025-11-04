"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinRoom() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function joinRoom() {
    if (!name.trim() || !code.trim()) {
      setError("Please enter both your name and room code");
      return;
    }

    if (code.length !== 6) {
      setError("Room code must be 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/room/join', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: code.toUpperCase(), name }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/room/${code.toUpperCase()}?name=${encodeURIComponent(name)}`);
      } else {
        setError(data.error || "Room not found");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Join a Room</h2>
      
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        className="border p-3 rounded-lg w-64 text-gray-800"
        disabled={loading}
      />
      
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter room code (6 chars)"
        className="border p-3 rounded-lg w-64 text-gray-800 font-mono"
        maxLength={6}
        disabled={loading}
      />
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      
      <button
        onClick={joinRoom}
        disabled={loading || !name.trim() || !code.trim()}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors"
      >
        {loading ? "Joining..." : "Join Room"}
      </button>
    </div>
  );
}