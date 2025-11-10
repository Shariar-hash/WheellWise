// CLEAN VERSION - Copy this to replace components/room/CreateRoom.tsx

"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import Link from "next/link";

export default function CreateRoom() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const displayName = session.user.user_metadata?.display_name || 
                          session.user.email?.split('@')[0] || '';
        setName(displayName);
      }
      setIsLoadingUser(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const displayName = session.user.user_metadata?.display_name || 
                          session.user.email?.split('@')[0] || '';
        setName(displayName);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async function createRoom() {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setLoading(true);

    try {
      const roomCode = generateRoomCode();
      
      const { data, error } = await supabase
        .from('room_state')
        .insert({
          room_code: roomCode,
          room_owner: name.trim(),
          room_owner_email: user?.email || null,
          participants: [name.trim()],
          wheel_options: [
            { id: '1', label: '🍎 Apple', color: '#ef4444', weight: 1, count: 1 },
            { id: '2', label: '🍌 Banana', color: '#eab308', weight: 1, count: 1 },
            { id: '3', label: '🍊 Orange', color: '#f97316', weight: 1, count: 1 },
            { id: '4', label: '🍇 Grape', color: '#8b5cf6', weight: 1, count: 1 },
          ]
        })
        .select()
        .single();

      if (error) throw error;

      setCode(roomCode);
      toast.success("Room created successfully!");
      
      setTimeout(() => {
        window.location.href = `/room/${roomCode}?name=${encodeURIComponent(name.trim())}&owner=true`;
      }, 2000);
    } catch (err: any) {
      console.error('Error creating room:', err);
      toast.error(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  if (isLoadingUser) {
    return (
      <div className="flex flex-col items-center gap-3 mt-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 mt-4">
      {/* User Status */}
      {user ? (
        <div className="w-full max-w-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url && (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Profile" 
                className="w-10 h-10 rounded-full"
              />
            )}
            <div className="flex-1">
              <p className="text-sm text-green-800 dark:text-green-200 font-semibold">
                Signed in as {user.email}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ Your ownership will be saved
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            ⚠️ Not signed in - Room ownership won't persist
          </p>
          <Link 
            href="/auth"
            className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline"
          >
            Sign in to save your ownership →
          </Link>
        </div>
      )}
      
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        className="border-2 border-slate-600 bg-slate-700 p-3 rounded-lg w-full max-w-md text-white focus:border-blue-500 focus:outline-none"
        disabled={loading}
      />
      
      <button
        onClick={createRoom}
        disabled={loading || !name.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors w-full max-w-md font-semibold"
      >
        {loading ? "Creating..." : "Create Room"}
      </button>

      {code && (
        <div className="mt-6 p-6 bg-green-900/30 border border-green-600 rounded-lg text-center w-full max-w-md">
          <p className="text-lg font-semibold text-green-300 mb-2">
            Room Created Successfully! 🎉
          </p>
          <p className="text-3xl font-bold text-green-400 mb-2 font-mono">
            {code}
          </p>
          <p className="text-sm text-green-200 mb-4">
            Share this code with friends to join your room!
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(code);
              toast.success('Code copied!');
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Copy Code
          </button>
        </div>
      )}
    </div>
  );
}
