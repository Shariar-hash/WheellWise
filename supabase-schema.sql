-- Enable Row Level Security
alter table if exists room_state enable row level security;
alter table if exists chat_messages enable row level security;
alter table if exists spin_events enable row level security;

-- Create room_state table
create table if not exists room_state (
  id uuid default gen_random_uuid() primary key,
  room_code text unique not null,
  participants text[] default '{}',
  wheel_options jsonb default '[]',
  is_spinning boolean default false,
  current_result text,
  room_owner text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chat_messages table  
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  room_code text not null,
  sender_name text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create spin_events table
create table if not exists spin_events (
  id uuid default gen_random_uuid() primary key,
  room_code text not null,
  result text not null,
  spun_by text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists room_state_room_code_idx on room_state(room_code);
create index if not exists chat_messages_room_code_idx on chat_messages(room_code);
create index if not exists chat_messages_created_at_idx on chat_messages(created_at);
create index if not exists spin_events_room_code_idx on spin_events(room_code);
create index if not exists spin_events_created_at_idx on spin_events(created_at);

-- RLS Policies (allow all for now, can be restricted later)
drop policy if exists "Allow all operations on room_state" on room_state;
create policy "Allow all operations on room_state" on room_state for all using (true);

drop policy if exists "Allow all operations on chat_messages" on chat_messages;  
create policy "Allow all operations on chat_messages" on chat_messages for all using (true);

drop policy if exists "Allow all operations on spin_events" on spin_events;
create policy "Allow all operations on spin_events" on spin_events for all using (true);

-- Enable realtime
alter publication supabase_realtime add table room_state;
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table spin_events;