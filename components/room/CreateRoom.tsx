"use client";
import { useState } from "react";

export default function CreateRoom() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createRoom() {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/room/create', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName: name }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setCode(data.roomCode);
        // Redirect to room as owner after a short delay
        setTimeout(() => {
          window.location.href = `/room/${data.roomCode}?name=${encodeURIComponent(name)}&owner=true`;
        }, 2000);
      } else {
        setError(data.error || "Failed to create room");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Create a Room</h2>
      
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        className="border p-3 rounded-lg w-64 text-gray-800"
        disabled={loading}
      />
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      
      <button
        onClick={createRoom}
        disabled={loading || !name.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors"
      >
        {loading ? "Creating..." : "Create Room"}
      </button>

      {code && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-lg font-semibold text-green-800 mb-2">
            Room Created Successfully! 🎉
          </p>
          <p className="text-2xl font-bold text-green-600 mb-2">
            Code: {code}
          </p>
          <p className="text-sm text-green-700">
            Share this code with friends to join your room!
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
          >
            Copy Code
          </button>
        </div>
      )}
    </div>
  );
}