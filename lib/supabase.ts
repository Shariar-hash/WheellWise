import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Types for our database tables
export interface RoomState {
  id: string
  room_code: string
  participants: string[]
  wheel_options: any[]
  is_spinning: boolean
  current_result: string | null
  room_owner: string
  room_owner_email: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  room_code: string
  sender_name: string
  sender_email: string | null
  sender_image: string | null
  message: string
  created_at: string
}

export interface SpinEvent {
  id: string
  room_code: string
  result: string
  spun_by: string
  created_at: string
}
