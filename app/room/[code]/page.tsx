'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase, RoomState, ChatMessage, SpinEvent } from '@/lib/supabase'
import SpinWheel from '@/components/wheel/spin-wheel'
import toast from 'react-hot-toast'

export default function Room({ params }: { params: { code: string } }) {
  const searchParams = useSearchParams()
  const name = searchParams?.get("name") || "Guest"
  const isOwner = searchParams?.get("owner") === "true"
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

  // Wheel options - make them manageable
  const [wheelOptions, setWheelOptions] = useState([
    { id: '1', label: '🍎 Apple', color: '#ef4444', weight: 1, count: 1 },
    { id: '2', label: '🍌 Banana', color: '#eab308', weight: 1, count: 1 },
    { id: '3', label: '🍊 Orange', color: '#f97316', weight: 1, count: 1 },
    { id: '4', label: '🍇 Grape', color: '#8b5cf6', weight: 1, count: 1 },
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize room and set up Supabase subscriptions
  useEffect(() => {
    if (!isClient || !roomCode) return;
    
    let roomStateChannel: any = null;
    let chatChannel: any = null;
    let spinChannel: any = null;

    const initializeRoom = async () => {
      try {
        setConnected(true);
        
        // First, try to get existing room or create if owner
        const { data: existingRoom, error: fetchError } = await supabase
          .from('room_state')
          .select('*')
          .eq('room_code', roomCode)
          .single();

        if (existingRoom) {
          // Room exists, join it
          const updatedParticipants = existingRoom.participants.includes(name) 
            ? existingRoom.participants 
            : [...existingRoom.participants, name];

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
            setRoomState(updatedRoom);
            setParticipants(updatedRoom.participants);
            setWheelOptions(updatedRoom.wheel_options);
            setRoomOwner(updatedRoom.room_owner);
            setIsSpinning(updatedRoom.is_spinning);
            setResult(updatedRoom.current_result || '');
          }
        } else if (isOwner) {
          // Create new room
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
            setRoomState(newRoom);
            setParticipants([name]);
            setRoomOwner(name);
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

    const setupSubscriptions = () => {
      // Subscribe to room state changes
      roomStateChannel = supabase
        .channel(`room_state_${roomCode}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'room_state', filter: `room_code=eq.${roomCode}` },
          (payload) => {
            console.log('Room state changed:', payload);
            const newState = payload.new as RoomState;
            if (newState) {
              setRoomState(newState);
              setParticipants(newState.participants);
              setWheelOptions(newState.wheel_options);
              setIsSpinning(newState.is_spinning);
              setResult(newState.current_result || '');
              
              if (newState.current_result && !newState.is_spinning) {
                setTargetResult(newState.current_result);
              }
            }
          }
        )
        .subscribe();

      // Subscribe to chat messages
      chatChannel = supabase
        .channel(`chat_${roomCode}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_code=eq.${roomCode}` },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      // Subscribe to spin events
      spinChannel = supabase
        .channel(`spin_${roomCode}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'spin_events', filter: `room_code=eq.${roomCode}` },
          (payload) => {
            const spinEvent = payload.new as SpinEvent;
            console.log('Spin event received:', spinEvent);
            setTargetResult(spinEvent.result);
            setIsSpinning(true);
          }
        )
        .subscribe();
    };

    initializeRoom().then(() => {
      setupSubscriptions();
    });

    // Cleanup function
    return () => {
      if (roomStateChannel) {
        supabase.removeChannel(roomStateChannel);
      }
      if (chatChannel) {
        supabase.removeChannel(chatChannel);
      }
      if (spinChannel) {
        supabase.removeChannel(spinChannel);
      }
    };
  }, [roomCode, name, isOwner, isClient]);

  const sendMessage = async () => {
    if (!chat.trim() || !connected) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_code: roomCode,
          sender_name: name,
          message: chat.trim()
        });

      if (error) throw error;
      setChat("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const updateWheelOptions = async (options: any[]) => {
    if (!isOwner || !connected) return;
    
    try {
      const { error } = await supabase
        .from('room_state')
        .update({ 
          wheel_options: options,
          updated_at: new Date().toISOString()
        })
        .eq('room_code', roomCode);

      if (error) throw error;
      
      setWheelOptions(options);
      toast.success('Wheel options updated!');
    } catch (error) {
      console.error('Error updating wheel options:', error);
      toast.error('Failed to update wheel options');
    }
  };

  const spinWheel = async () => {
    if (!connected || !isOwner || isSpinning || wheelOptions.length === 0) return;

    try {
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

      // Update room state to start spinning
      const { error: roomError } = await supabase
        .from('room_state')
        .update({ 
          is_spinning: true,
          current_result: null,
          updated_at: new Date().toISOString()
        })
        .eq('room_code', roomCode);

      if (roomError) throw roomError;

      // Create spin event for synchronization
      const { error: spinError } = await supabase
        .from('spin_events')
        .insert({
          room_code: roomCode,
          result: selectedOption.label,
          spun_by: name
        });

      if (spinError) throw spinError;

      // After 4 seconds, set the final result
      setTimeout(async () => {
        const { error: resultError } = await supabase
          .from('room_state')
          .update({ 
            is_spinning: false,
            current_result: selectedOption.label,
            updated_at: new Date().toISOString()
          })
          .eq('room_code', roomCode);

        if (resultError) {
          console.error('Error setting result:', resultError);
        }
      }, 4000);

    } catch (error) {
      console.error('Error spinning wheel:', error);
      toast.error('Failed to spin wheel');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
          {isOwner && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
              👑 Room Owner
            </span>
          )}
        </div>

        {/* Participants */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">
            Participants ({participants.length}):
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

        {/* Wheel Options Management for Owner */}
        {isOwner && (
          <div className="mb-6 bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Wheel Options</h3>
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

        {/* Spin Wheel */}
        <div className="bg-white border rounded-lg p-6 mb-6 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Spin the Wheel!</h3>
          {!isOwner && (
            <p className="text-sm text-gray-600 mb-3">
              Only the room owner ({roomOwner}) can spin the wheel
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
              onWheelClick={isOwner ? spinWheel : undefined}
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
              messages.map((m, i) => (
                <div key={i} className={`mb-3 flex ${m.sender_name === name ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-xs ${m.sender_name === name ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Profile Avatar */}
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                        m.sender_name === name ? 'bg-blue-500' : 
                        m.sender_name === roomOwner ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}>
                        {m.sender_name.charAt(0).toUpperCase()}
                        {m.sender_name === roomOwner && '👑'}
                      </div>
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`rounded-lg px-3 py-2 ${
                      m.sender_name === name 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border shadow-sm'
                    }`}>
                      {m.sender_name !== name && (
                        <div className="text-xs font-semibold mb-1 text-gray-600">
                          {m.sender_name} {m.sender_name === roomOwner && '👑'}
                        </div>
                      )}
                      <div className="text-sm">{m.message}</div>
                      <div className={`text-xs mt-1 ${m.sender_name === name ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
