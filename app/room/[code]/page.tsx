'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase, RoomState, ChatMessage, SpinEvent } from '@/lib/supabase'
import SpinWheel from '@/components/wheel/spin-wheel'
import toast from 'react-hot-toast'

export default function Room({ params }: { params: { code: string } }) {
  const searchParams = useSearchParams()
  const name = searchParams?.get("name") || "Guest"
  const isOwnerParam = searchParams?.get("owner") === "true"
  const roomCode = params?.code

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [chat, setChat] = useState("");
  const [result, setResult] = useState("");
  const [connected, setConnected] = useState(false);
  const [roomOwner, setRoomOwner] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [targetResult, setTargetResult] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(isOwnerParam);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Wheel options - make them manageable
  const [wheelOptions, setWheelOptions] = useState([
    { id: '1', label: '🍎 Apple', color: '#ef4444', weight: 1, count: 1 },
    { id: '2', label: '🍌 Banana', color: '#eab308', weight: 1, count: 1 },
    { id: '3', label: '🍊 Orange', color: '#f97316', weight: 1, count: 1 },
    { id: '4', label: '🍇 Grape', color: '#8b5cf6', weight: 1, count: 1 },
  ]);

  useEffect(() => {
    setIsClient(true);
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
      }
    });
  }, []);

  // Heartbeat to maintain participant presence  
  useEffect(() => {
    if (!connected || !roomCode || !name) return;

    const heartbeat = setInterval(async () => {
      try {
        // Update participant's last seen timestamp
        await supabase
          .from('room_state')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('room_code', roomCode);
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeat);
  }, [connected, roomCode, name]);

  // No need for additional polling - already polling in main useEffect

  // Initialize room and set up polling (no realtime needed)
  useEffect(() => {
    if (!isClient || !roomCode) return;

    const initializeRoom = async () => {
      try {
        console.log('🚀 Initializing room:', roomCode);
        console.log('👤 User:', name, '| Owner:', isOwner);
        setConnected(true);
        
        // First, try to get existing room or create if owner
        console.log('📡 Fetching room state from database...');
        const { data: existingRoom, error: fetchError } = await supabase
          .from('room_state')
          .select('*')
          .eq('room_code', roomCode)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          // Error other than "not found"
          console.error('❌ Database error:', fetchError);
          throw new Error(`Database error: ${fetchError.message}`);
        }

        if (existingRoom) {
          // Room exists, join it
          console.log('📋 Existing room found, joining...');
          
          // **OWNERSHIP CHECK - Multiple ways to verify ownership**
          let isRoomOwner = false;
          
          // Method 1: URL parameter says owner=true
          if (isOwnerParam) {
            isRoomOwner = true;
            console.log('👑 Owner via URL parameter');
          }
          
          // Method 2: Logged-in user's email matches room owner's email (persistent ownership)
          if (currentUser?.email && existingRoom.room_owner_email === currentUser.email) {
            isRoomOwner = true;
            console.log('👑 Persistent ownership detected via email!');
          }
          
          // Method 3: User's name matches room owner's name (for non-logged-in users)
          if (name === existingRoom.room_owner) {
            isRoomOwner = true;
            console.log('👑 Ownership detected via name match!');
          }
          
          // Set ownership status
          if (isRoomOwner) {
            setIsOwner(true);
          }
          
          const isAlreadyInRoom = existingRoom.participants.includes(name);
          
          if (!isAlreadyInRoom) {
            // Add participant to room
            const updatedParticipants = [...existingRoom.participants, name];
            console.log(`👤 Adding participant: ${name}. Total will be: ${updatedParticipants.length}`);

            const { data: updatedRoom, error: updateError } = await supabase
              .from('room_state')
              .update({ 
                participants: updatedParticipants,
                updated_at: new Date().toISOString()
              })
              .eq('room_code', roomCode)
              .select()
              .single();

            if (updatedRoom) {
              console.log('✅ Successfully joined room:', updatedRoom);
              setRoomState(updatedRoom);
              setParticipants(updatedRoom.participants);
              setWheelOptions(updatedRoom.wheel_options || wheelOptions);
              setRoomOwner(updatedRoom.room_owner);
              setIsSpinning(updatedRoom.is_spinning);
              setResult(updatedRoom.current_result || '');
              toast.success(`Joined room! ${updatedRoom.participants.length} participants online`);
            }
          } else {
            // Already in room, just sync state
            console.log('👤 Already in room, syncing state...');
            setRoomState(existingRoom);
            setParticipants(existingRoom.participants);
            setWheelOptions(existingRoom.wheel_options || wheelOptions);
            setRoomOwner(existingRoom.room_owner);
            setIsSpinning(existingRoom.is_spinning);
            setResult(existingRoom.current_result || '');
            toast.success(`Welcome back! ${existingRoom.participants.length} participants online`);
          }
        } else if (isOwner) {
          // Create new room
          console.log('🏗️ Creating new room...');
          const { data: newRoom, error: createError } = await supabase
            .from('room_state')
            .insert({
              room_code: roomCode,
              participants: [name],
              wheel_options: wheelOptions,
              is_spinning: false,
              current_result: null,
              room_owner: name
            })
            .select()
            .single();

          if (newRoom) {
            console.log('✅ Room created successfully:', newRoom);
            setRoomState(newRoom);
            setParticipants([name]);
            setRoomOwner(name);
            setWheelOptions(wheelOptions);
            toast.success('Room created successfully!');
          } else {
            throw new Error('Failed to create room');
          }
        } else {
          throw new Error('Room not found');
        }

        // Load chat messages
        const { data: chatMessages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_code', roomCode)
          .order('created_at', { ascending: true })
          .limit(50);

        if (chatMessages) {
          setMessages(chatMessages);
        }

      } catch (error) {
        console.error('Error initializing room:', error);
        setConnected(false);
        toast.error('Failed to connect to room');
      }
    };

    const setupPolling = () => {
      console.log('🔄 Setting up polling for room:', roomCode);
      console.log('⚠️ Realtime not available - using polling every 2 seconds');
      
      // Poll room state every 500ms for near real-time sync
      const pollInterval = setInterval(async () => {
        try {
          const { data: currentRoom, error } = await supabase
            .from('room_state')
            .select('*')
            .eq('room_code', roomCode)
            .single();
            
          if (currentRoom && !error) {
            const oldParticipantCount = participants.length;
            const newParticipantCount = currentRoom.participants?.length || 0;
            const wasSpinning = isSpinning;
            
            // Always update basic state first
            setRoomState(currentRoom);
            setParticipants(currentRoom.participants || []);
            setWheelOptions(currentRoom.wheel_options || []);
            setRoomOwner(currentRoom.room_owner);
            
            // Handle spin synchronization - CRITICAL for exact sync
            if (currentRoom.is_spinning && !wasSpinning) {
              // Spin just started - sync everyone to the SAME result
              console.log('🎡 SPIN STARTED - Syncing to EXACT result for all participants');
              console.log('🎯 Target result (same for everyone):', currentRoom.current_result);
              setIsSpinning(true);
              setTargetResult(currentRoom.current_result); // This ensures same result
              setResult(''); // Clear previous result
              // Only show toast for non-owner
              if (!isOwner) {
                toast(`🎡 Spinning...`);
              }
            } else if (currentRoom.is_spinning && wasSpinning) {
              // Still spinning - make sure targetResult stays set
              setIsSpinning(true);
              setTargetResult(currentRoom.current_result);
            } else if (!currentRoom.is_spinning && wasSpinning && currentRoom.current_result) {
              // Spin just completed
              console.log('🎯 SPIN COMPLETED - Same result for everyone:', currentRoom.current_result);
              setIsSpinning(false);
              setResult(currentRoom.current_result);
              setTargetResult(null);
              // No toast here - result is shown in UI
            } else {
              // No spin in progress
              setIsSpinning(false);
              setResult(currentRoom.current_result || '');
              setTargetResult(null);
            }
            
            // Show participant changes (only log, no toast spam)
            if (newParticipantCount !== oldParticipantCount && oldParticipantCount > 0) {
              if (newParticipantCount > oldParticipantCount) {
                console.log(`👤 Participant joined: ${oldParticipantCount} → ${newParticipantCount}`);
              } else {
                console.log(`👤 Participant left: ${oldParticipantCount} → ${newParticipantCount}`);
              }
            }
            
            setConnected(true);
          }
        } catch (error) {
          console.error('Polling error:', error);
          setConnected(false);
        }
      }, 500); // Poll every 500ms for fast sync
      
      // Also poll chat messages
      const pollChat = setInterval(async () => {
        try {
          const { data: chatMessages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('room_code', roomCode)
            .order('created_at', { ascending: true })
            .limit(50);
          
          if (error) {
            console.error('Chat fetch error:', error);
            return;
          }
            
          if (chatMessages) {
            setMessages(chatMessages);
          }
        } catch (error) {
          console.error('Chat polling error:', error);
        }
      }, 3000); // Poll chat every 3 seconds
      
      return { pollInterval, pollChat };
    };

    let pollIntervals: any = null;
    
    initializeRoom().then(() => {
      pollIntervals = setupPolling();
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up polling intervals');
      if (pollIntervals) {
        clearInterval(pollIntervals.pollInterval);
        clearInterval(pollIntervals.pollChat);
      }
    };
  }, [roomCode, name, isOwner, isClient]);

  // Handle participant leaving when window closes/navigates away
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (roomCode && name) {
        try {
          console.log('👋 Participant leaving room:', name);
          // Get current room state
          const { data: currentRoom } = await supabase
            .from('room_state')
            .select('participants')
            .eq('room_code', roomCode)
            .single();
            
          if (currentRoom) {
            // Remove participant from room
            const updatedParticipants = currentRoom.participants.filter((p: string) => p !== name);
            await supabase
              .from('room_state')
              .update({ 
                participants: updatedParticipants,
                updated_at: new Date().toISOString()
              })
              .eq('room_code', roomCode);
            console.log(`👋 ${name} removed from room. ${updatedParticipants.length} participants remain.`);
          }
        } catch (error) {
          console.error('Error removing participant:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomCode, name]);

  const refreshRoomState = async () => {
    if (!roomCode) return;
    
    try {
      console.log('🔄 Manually refreshing room state...');
      toast.loading('Refreshing room...');
      
      const { data: currentRoom, error } = await supabase
        .from('room_state')
        .select('*')
        .eq('room_code', roomCode)
        .single();
        
      if (currentRoom && !error) {
        console.log('✅ Room state refreshed:', currentRoom);
        setRoomState(currentRoom);
        setParticipants(currentRoom.participants || []);
        setWheelOptions(currentRoom.wheel_options || wheelOptions);
        setRoomOwner(currentRoom.room_owner);
        setIsSpinning(currentRoom.is_spinning || false);
        setResult(currentRoom.current_result || '');
        toast.dismiss();
        toast.success(`Room synced! ${currentRoom.participants.length} participants online`);
      } else {
        throw error || new Error('Room not found');
      }
    } catch (error) {
      console.error('Error refreshing room state:', error);
      toast.dismiss();
      toast.error('Failed to refresh room state');
    }
  };

  const checkConnection = async () => {
    try {
      const { error } = await supabase
        .from('room_state')
        .select('id')
        .limit(1);
      
      if (!error) {
        setConnected(true);
        return true;
      }
    } catch {
      setConnected(false);
    }
    return false;
  };

  const sendMessage = async () => {
    if (!chat.trim() || !connected) return;
    
    const messageToSend = chat.trim();
    setChat(""); // Clear input immediately for better UX
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_code: roomCode,
          sender_name: name,
          sender_email: currentUser?.email || null,
          sender_image: currentUser?.user_metadata?.avatar_url || null,
          message: messageToSend
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add message to local state immediately (before polling sync)
      if (data) {
        setMessages(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setChat(messageToSend); // Restore message if failed
    }
  };

  const updateWheelOptions = async (options: any[]) => {
    if (!isOwner) {
      toast.error('❌ Only the room owner can modify wheel options');
      return;
    }
    
    try {
      console.log('🔧 Room owner updating wheel options:', options.length, 'options');
      
      // Update local state immediately for instant feedback
      setWheelOptions(options);
      
      // Sync to database (will trigger real-time update for all participants)
      const { data, error } = await supabase
        .from('room_state')
        .update({ 
          wheel_options: options,
          updated_at: new Date().toISOString()
        })
        .eq('room_code', roomCode);

      if (error) {
        console.error('❌ Failed to update wheel options:', error);
        throw error;
      }
      
      console.log(`✅ Wheel options synchronized to all ${participants.length} participants`);
      toast.success(`✅ Options updated for all ${participants.length} participants!`);
    } catch (error) {
      console.error('Error updating wheel options:', error);
      toast.error('Failed to update wheel options');
    }
  };

  const spinWheel = async () => {
    if (!isOwner) {
      toast.error('Only the room owner can spin the wheel');
      return;
    }
    
    if (isSpinning) {
      toast.error('Wheel is already spinning');
      return;
    }
    
    if (wheelOptions.length === 0) {
      toast.error('Add some wheel options first');
      return;
    }

    try {
      console.log('🎡 Room owner initiating wheel spin for all participants...');
      toast.loading('Starting wheel spin...');
      
      // Weight-based random selection
      const totalWeight = wheelOptions.reduce((sum, opt) => sum + ((opt.count || 1) * (opt.weight || 1)), 0);
      let random = Math.random() * totalWeight;
      let selectedOption = wheelOptions[0];
      
      for (const option of wheelOptions) {
        const optionWeight = (option.count || 1) * (option.weight || 1);
        random -= optionWeight;
        if (random <= 0) {
          selectedOption = option;
          break;
        }
      }

      console.log('🎯 Pre-determined result (SAME FOR ALL):', selectedOption.label);
      console.log('📍 Room code:', roomCode);
      console.log('👥 Total participants:', participants.length);

      // STEP 1: Update database FIRST (polling will handle UI update)
      // This ensures ALL participants (including owner) get the SAME result via polling
      console.log('STEP 1: Updating database - room_state table');
      const { data: roomData, error: roomError } = await supabase
        .from('room_state')
        .update({ 
          is_spinning: true,
          current_result: selectedOption.label,
          updated_at: new Date().toISOString()
        })
        .eq('room_code', roomCode)
        .select();

      if (roomError) {
        console.error('❌ Failed to update room state:', roomError);
        toast.dismiss();
        toast.error('Failed to start spin - database error');
        throw roomError;
      }
      
      console.log('✅ Room state updated in database:', roomData);

      // STEP 2: Create spin event for tracking
      console.log('STEP 2: Creating spin_events entry');
      const { data: spinData, error: spinError } = await supabase
        .from('spin_events')
        .insert({
          room_code: roomCode,
          result: selectedOption.label,
          spun_by: name
        })
        .select();

      if (spinError) {
        console.error('❌ Failed to create spin event:', spinError);
        toast.dismiss();
        toast.error('Failed to sync spin event');
        throw spinError;
      }
      
      console.log('✅ Spin event created:', spinData);

      toast.dismiss();
      console.log(`✅ Wheel spin synchronized to all ${participants.length} participants`);
      console.log('🔔 Polling will sync the spin to all clients within 2 seconds');
      console.log('⭐ ALL participants will see SAME result:', selectedOption.label);
      toast.success(`🎡 Spinning for all ${participants.length} participants!`);

      // Note: Polling will update local state for owner too - ensures exact sync
      
      // STEP 3: After spin animation completes (4 seconds), mark as finished for all participants
      setTimeout(async () => {
        try {
          console.log('⏱️ Spin animation complete, updating final state...');
          const { error: resultError } = await supabase
            .from('room_state')
            .update({ 
              is_spinning: false,
              current_result: selectedOption.label, // Keep the result
              updated_at: new Date().toISOString()
            })
            .eq('room_code', roomCode);

          if (resultError) {
            console.error('❌ Error finishing spin:', resultError);
          } else {
            console.log('✅ Spin completed and synchronized to database');
            console.log('🔔 Polling will show final result to all participants');
            // Note: Don't update local state here - let polling handle it
            // This ensures ALL participants (including owner) get updated the same way
          }
        } catch (error) {
          console.error('❌ Error in spin completion:', error);
        }
      }, 4000);

    } catch (error) {
      console.error('Error spinning wheel:', error);
      toast.error('Failed to spin wheel');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isClient) {
    return (
      <div className="flex flex-col items-center mt-10 p-4">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">
            🎡 Loading Room...
          </h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-10 p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-blue-600 text-center mb-2">
          🎡 Room: {roomCode}
        </h1>
        
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={refreshRoomState}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
            title="Refresh room state"
          >
            🔄 Refresh
          </button>
          {isOwner && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
              👑 Room Owner
            </span>
          )}
        </div>

        {/* Participants */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">
            🟢 {participants.length} {participants.length === 1 ? 'Participant' : 'Participants'} Online:
          </h3>
          <div className="flex flex-wrap gap-2">
            {participants.map((p, i) => (
              <span 
                key={i} 
                className={`px-3 py-1 rounded-full text-sm ${
                  p === name 
                    ? 'bg-blue-100 text-blue-800 font-semibold' 
                    : p === roomOwner 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {p === name ? `${p} (You)` : p} 
                {p === roomOwner && ' 👑'}
              </span>
            ))}
          </div>
        </div>

        {/* Wheel Options Management for Owner ONLY */}
        {isOwner && (
          <div className="mb-6 bg-white border-2 border-yellow-300 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              👑 Manage Wheel Options <span className="text-xs text-yellow-600">(Owner Only)</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">Add, remove, or modify wheel options. Changes sync to all participants.</p>
            <div className="space-y-2">
              {wheelOptions.map((option, index) => (
                <div key={option.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: option.color }}></div>
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => {
                      const newOptions = [...wheelOptions];
                      newOptions[index] = { ...newOptions[index], label: e.target.value };
                      updateWheelOptions(newOptions);
                    }}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={option.count || 1}
                    onChange={(e) => {
                      const newOptions = [...wheelOptions];
                      newOptions[index] = { ...newOptions[index], count: parseInt(e.target.value) || 1 };
                      updateWheelOptions(newOptions);
                    }}
                    className="w-16 px-2 py-1 border rounded text-sm"
                    title="Segments"
                  />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={option.weight || 1}
                    onChange={(e) => {
                      const newOptions = [...wheelOptions];
                      newOptions[index] = { ...newOptions[index], weight: parseInt(e.target.value) || 1 };
                      updateWheelOptions(newOptions);
                    }}
                    className="w-16 px-2 py-1 border rounded text-sm"
                    title="Weight"
                  />
                  <button
                    onClick={() => {
                      const newOptions = wheelOptions.filter((_, i) => i !== index);
                      updateWheelOptions(newOptions);
                    }}
                    className="text-red-500 hover:text-red-700 px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const colors = ['#ef4444', '#eab308', '#f97316', '#8b5cf6', '#ec4899', '#22c55e'];
                  const newOption = {
                    id: Date.now().toString(),
                    label: `Option ${wheelOptions.length + 1}`,
                    color: colors[wheelOptions.length % colors.length],
                    weight: 1,
                    count: 1
                  };
                  updateWheelOptions([...wheelOptions, newOption]);
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-gray-400"
              >
                + Add Option
              </button>
            </div>
          </div>
        )}

        {/* Current Wheel Options Display for Non-Owners */}
        {!isOwner && wheelOptions.length > 0 && (
          <div className="mb-6 bg-gray-50 border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Wheel Options</h3>
            <div className="grid grid-cols-2 gap-2">
              {wheelOptions.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: option.color }}></div>
                  <span className="text-sm font-medium flex-1">{option.label}</span>
                  <span className="text-xs text-gray-500">×{option.count || 1}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              ⚠️ Only {roomOwner} (owner) can modify options
            </p>
          </div>
        )}

        {/* Spin Wheel */}
        <div className="bg-white border rounded-lg p-6 mb-6 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">🎡 Spin the Wheel!</h3>
          {!isOwner && (
            <p className="text-sm text-orange-600 font-semibold mb-3 bg-orange-50 p-2 rounded">
              👑 Only the room owner ({roomOwner}) can spin the wheel
            </p>
          )}
          
          <div className="flex justify-center mb-4">
            <SpinWheel
              options={wheelOptions}
              spinning={isSpinning}
              targetResult={targetResult || undefined}
              onSpinComplete={(result: any) => {
                console.log('Wheel spin completed locally:', result);
                setIsSpinning(false);
              }}
              onWheelClick={isOwner ? spinWheel : () => {
                toast.error('❌ Only the room owner can spin the wheel!');
                console.log('🚫 Non-owner attempted to spin wheel');
              }}
              spinDuration={4}
              theme={{
                backgroundColor: '#1e293b',
                pointerColor: '#ef4444',
                borderColor: '#ffffff'
              }}
            />
          </div>
          
          {!isOwner && (
            <p className="text-sm text-orange-600 font-semibold">
              Watch the wheel - only {roomOwner} can control it!
            </p>
          )}
          
          {isOwner && (
            <button
              onClick={spinWheel}
              disabled={!connected || isSpinning || wheelOptions.length === 0}
              className={`px-8 py-4 rounded-lg text-lg font-semibold transition-colors ${
                connected && !isSpinning && wheelOptions.length > 0
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              🎡 {isSpinning ? 'Spinning...' : wheelOptions.length === 0 ? 'Add Options First' : 'Spin Wheel'}
            </button>
          )}
          
          {result && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-lg text-green-700 font-semibold">
                🎉 Result: {result}
              </p>
            </div>
          )}
        </div>

        {/* Chat Section - Messenger Style */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <h3 className="font-semibold flex items-center gap-2">
              💬 Room Chat
              <span className="text-blue-200 text-sm">({participants.length} online)</span>
            </h3>
          </div>
          
          <div className="h-64 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <div className="text-4xl mb-2">💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((m, i) => {
                const isMyMessage = m.sender_name === name;
                const isOwnerMessage = m.sender_name === roomOwner;
                
                return (
                <div key={i} className={`mb-3 flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-xs ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Profile Avatar */}
                    <div className="flex-shrink-0">
                      {m.sender_image ? (
                        <img 
                          src={m.sender_image} 
                          alt={m.sender_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                          isMyMessage ? 'bg-blue-500' : 
                          isOwnerMessage ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}>
                          {m.sender_name.charAt(0).toUpperCase()}
                          {isOwnerMessage && '👑'}
                        </div>
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`rounded-lg px-3 py-2 ${
                      isMyMessage 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border shadow-sm text-gray-800'
                    }`}>
                      {!isMyMessage && (
                        <div className="text-xs font-semibold mb-1 text-gray-600">
                          {m.sender_name} {isOwnerMessage && '👑'}
                        </div>
                      )}
                      <div className="text-sm break-words">
                        {m.message}
                      </div>
                      <div className={`text-xs mt-1 ${isMyMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
          
          {/* Message Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                value={chat}
                onChange={(e) => setChat(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={connected ? "Type a message..." : "Connecting..."}
                className="border-2 border-gray-200 focus:border-blue-500 p-3 flex-1 rounded-full text-gray-800 outline-none transition-colors"
                disabled={!connected}
              />
              <button 
                onClick={sendMessage} 
                disabled={!connected || !chat.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors min-w-[48px] flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
