import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const { hostName } = await request.json()

    if (!hostName || hostName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Host name is required' },
        { status: 400 }
      )
    }

    // Generate unique room code
    let roomCode = generateRoomCode()
    let attempts = 0
    let isUnique = false

    while (!isUnique && attempts < 10) {
      const { data } = await supabase
        .from('room_state')
        .select('code')
        .eq('code', roomCode)
        .single()

      if (!data) {
        isUnique = true
      } else {
        roomCode = generateRoomCode()
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique room code' },
        { status: 500 }
      )
    }

    // Create room in Supabase
    const { error: insertError } = await supabase
      .from('room_state')
      .insert({
        code: roomCode,
        name: `${hostName}'s Room`,
        owner_id: hostName,
        wheel_options: [
          { id: '1', label: '🍎 Apple', color: '#ef4444', weight: 1 },
          { id: '2', label: '🍌 Banana', color: '#eab308', weight: 1 },
          { id: '3', label: '🍊 Orange', color: '#f97316', weight: 1 },
          { id: '4', label: '🍇 Grape', color: '#8b5cf6', weight: 1 },
          { id: '5', label: '🍓 Strawberry', color: '#ec4899', weight: 1 },
          { id: '6', label: '🥝 Kiwi', color: '#22c55e', weight: 1 }
        ],
        participants: []
      })

    if (insertError) {
      console.error('Error inserting room:', insertError)
      return NextResponse.json(
        { error: 'Failed to create room in database' },
        { status: 500 }
      )
    }
    
    console.log(`Room created: ${roomCode} by ${hostName}`)
    
    return NextResponse.json({
      success: true,
      roomCode: roomCode,
      hostName: hostName,
      message: 'Room created successfully'
    })

  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}