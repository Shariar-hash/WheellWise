-- Create room_state table
CREATE TABLE IF NOT EXISTS room_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  wheel_options JSONB DEFAULT '[]'::jsonb,
  participants TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spin_events table
CREATE TABLE IF NOT EXISTS spin_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL,
  user_name TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE room_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we're using room codes for security)
CREATE POLICY "Allow all access to room_state" ON room_state FOR ALL USING (true);
CREATE POLICY "Allow all access to chat_messages" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Allow all access to spin_events" ON spin_events FOR ALL USING (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE room_state;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE spin_events;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_room_state_code ON room_state(code);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_code ON chat_messages(room_code);
CREATE INDEX IF NOT EXISTS idx_spin_events_room_code ON spin_events(room_code);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_room_state_updated_at BEFORE UPDATE ON room_state
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
