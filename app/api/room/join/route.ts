import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { roomCode, name } = await request.json()

    if (!roomCode || !name) {
      return NextResponse.json(
        { error: 'Room code and name are required' },
        { status: 400 }
      )
    }

    // Check if room exists in Supabase
    const { data: room, error } = await supabase
      .from('room_state')
      .select('*')
      .eq('code', roomCode)
      .single()

    if (error || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      roomCode: roomCode,
      name: name,
      message: 'Successfully joined room'
    })

  } catch (error) {
    console.error('Error joining room:', error)
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    )
  }
}