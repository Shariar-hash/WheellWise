import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Room state type
export type RoomState = {
  id: string;
  code: string;
  name: string;
  owner_id: string;
  wheel_options: Array<{
    id: string;
    label: string;
    color: string;
    weight: number;
  }>;
  participants: string[];
  created_at: string;
  updated_at: string;
};

// Chat message type
export type ChatMessage = {
  id: string;
  room_code: string;
  user_name: string;
  message: string;
  created_at: string;
};

// Spin event type
export type SpinEvent = {
  id: string;
  room_code: string;
  user_name: string;
  result: string;
  created_at: string;
};
