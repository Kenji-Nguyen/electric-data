'use server'

import { createServerClient, type ElectricalDevice } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const RoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  roomType: z.string().optional(),
})

const RoomArraySchema = z.array(RoomSchema)

export interface RoomInput {
  roomNumber: string
  roomType?: string
}

export interface Room {
  id: string
  tenant_id: string
  room_number: string
  room_type: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export async function createRoom(tenantId: string, roomData: RoomInput) {
  try {
    const validatedRoom = RoomSchema.parse(roomData)
    const supabase = createServerClient()

    // Get the next display order
    const { data: existingRooms } = await supabase
      .from('rooms')
      .select('display_order')
      .eq('tenant_id', tenantId)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = existingRooms && existingRooms.length > 0
      ? (existingRooms[0].display_order || 0) + 1
      : 1

    const { data, error } = await supabase
      .from('rooms')
      .insert([{
        tenant_id: tenantId,
        room_number: validatedRoom.roomNumber,
        room_type: validatedRoom.roomType || null,
        display_order: nextOrder,
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Room number already exists for this hotel' }
      }
      console.error('Error creating room:', error)
      return { success: false, error: 'Failed to create room' }
    }

    revalidatePath(`/tenants/${tenantId}/rooms`)
    return { success: true, room: data as Room, message: 'Room created successfully' }
  } catch (error) {
    console.error('Error creating room:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid room data provided' }
    }

    return { success: false, error: 'Failed to create room. Please try again.' }
  }
}

export async function getRoomsByTenant(tenantId: string) {
  try {
    const supabase = createServerClient()

    const { data: rooms, error } = await supabase
      .from('rooms')
      .select(`
        *,
        electrical_devices(count)
      `)
      .eq('tenant_id', tenantId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching rooms:', error)
      return { success: false, error: 'Failed to fetch rooms', rooms: [] }
    }

    return { success: true, rooms: rooms || [] }
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return { success: false, error: 'Failed to fetch rooms', rooms: [] }
  }
}

export async function updateRoom(roomId: string, roomData: RoomInput) {
  try {
    const validatedRoom = RoomSchema.parse(roomData)
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('rooms')
      .update({
        room_number: validatedRoom.roomNumber,
        room_type: validatedRoom.roomType || null,
      })
      .eq('id', roomId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Room number already exists for this hotel' }
      }
      console.error('Error updating room:', error)
      return { success: false, error: 'Failed to update room' }
    }

    // Get tenant_id for revalidation
    const tenantId = data.tenant_id
    revalidatePath(`/tenants/${tenantId}/rooms`)

    return { success: true, room: data as Room, message: 'Room updated successfully' }
  } catch (error) {
    console.error('Error updating room:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid room data provided' }
    }

    return { success: false, error: 'Failed to update room. Please try again.' }
  }
}

export async function deleteRoom(roomId: string) {
  try {
    const supabase = createServerClient()

    // First get the room to get tenant_id for revalidation
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('tenant_id')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return { success: false, error: 'Room not found' }
    }

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)

    if (error) {
      console.error('Error deleting room:', error)
      return { success: false, error: 'Failed to delete room' }
    }

    revalidatePath(`/tenants/${room.tenant_id}/rooms`)
    return { success: true, message: 'Room deleted successfully' }
  } catch (error) {
    console.error('Error deleting room:', error)
    return { success: false, error: 'Failed to delete room. Please try again.' }
  }
}

export async function copyRoomDevices(sourceRoomId: string, targetRoomId: string) {
  try {
    const supabase = createServerClient()

    // Get devices from source room
    const { data: sourceDevices, error: fetchError } = await supabase
      .from('electrical_devices')
      .select('device_name, power_watts, usage_hours_per_day, tenant_id')
      .eq('room_id', sourceRoomId)

    if (fetchError) {
      console.error('Error fetching source devices:', fetchError)
      return { success: false, error: 'Failed to fetch devices from source room' }
    }

    if (!sourceDevices || sourceDevices.length === 0) {
      return { success: false, error: 'Source room has no devices to copy' }
    }

    // Prepare devices for insertion with new room_id
    const devicesToInsert = sourceDevices.map(device => ({
      tenant_id: device.tenant_id,
      room_id: targetRoomId,
      device_name: device.device_name,
      power_watts: device.power_watts,
      usage_hours_per_day: device.usage_hours_per_day,
    }))

    const { error: insertError } = await supabase
      .from('electrical_devices')
      .insert(devicesToInsert)

    if (insertError) {
      console.error('Error copying devices:', insertError)
      return { success: false, error: 'Failed to copy devices to target room' }
    }

    // Get tenant_id for revalidation
    const tenantId = sourceDevices[0].tenant_id
    revalidatePath(`/tenants/${tenantId}/rooms`)

    return {
      success: true,
      message: `Successfully copied ${sourceDevices.length} device(s) to target room`
    }
  } catch (error) {
    console.error('Error copying room devices:', error)
    return { success: false, error: 'Failed to copy devices. Please try again.' }
  }
}

export async function getNextRoom(currentRoomId: string, tenantId: string) {
  try {
    const supabase = createServerClient()

    // Get current room's display order
    const { data: currentRoom, error: currentError } = await supabase
      .from('rooms')
      .select('display_order')
      .eq('id', currentRoomId)
      .single()

    if (currentError || !currentRoom) {
      return { success: false, error: 'Current room not found' }
    }

    // Get next room with higher display order
    const { data: nextRoom, error: nextError } = await supabase
      .from('rooms')
      .select('id, room_number')
      .eq('tenant_id', tenantId)
      .gt('display_order', currentRoom.display_order)
      .order('display_order', { ascending: true })
      .limit(1)
      .single()

    if (nextError && nextError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching next room:', nextError)
      return { success: false, error: 'Failed to fetch next room' }
    }

    return {
      success: true,
      nextRoom: nextRoom || null,
      isLastRoom: !nextRoom
    }
  } catch (error) {
    console.error('Error getting next room:', error)
    return { success: false, error: 'Failed to get next room. Please try again.' }
  }
}

export async function getTenantDashboard(tenantId: string) {
  try {
    const supabase = createServerClient()

    // Get tenant details
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return { success: false, error: 'Tenant not found', data: null }
    }

    // Get rooms with devices and power calculations
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select(`
        *,
        electrical_devices (
          id,
          device_name,
          power_watts,
          usage_hours_per_day
        )
      `)
      .eq('tenant_id', tenantId)
      .order('display_order', { ascending: true })

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError)
      return { success: false, error: 'Failed to fetch rooms', data: null }
    }

    // Calculate metrics
    const roomsWithMetrics = (rooms || []).map(room => {
      const devices = room.electrical_devices || []
      const dailyWattHours = devices.reduce((total: number, device: ElectricalDevice) => {
        return total + (device.power_watts * device.usage_hours_per_day)
      }, 0)

      const dailyKwh = dailyWattHours / 1000
      const monthlyKwh = dailyKwh * 30
      const yearlyKwh = dailyKwh * 365

      // Determine health status based on consumption
      let healthStatus: 'good' | 'moderate' | 'high' = 'good'
      if (dailyKwh > 20) healthStatus = 'high'
      else if (dailyKwh > 10) healthStatus = 'moderate'

      return {
        ...room,
        deviceCount: devices.length,
        dailyKwh: Math.round(dailyKwh * 100) / 100,
        monthlyKwh: Math.round(monthlyKwh * 100) / 100,
        yearlyKwh: Math.round(yearlyKwh * 100) / 100,
        healthStatus,
        devices
      }
    })

    // Calculate overall stats
    const totalRooms = roomsWithMetrics.length
    const totalDevices = roomsWithMetrics.reduce((sum, room) => sum + room.deviceCount, 0)
    const totalDailyKwh = roomsWithMetrics.reduce((sum, room) => sum + room.dailyKwh, 0)
    const totalMonthlyKwh = roomsWithMetrics.reduce((sum, room) => sum + room.monthlyKwh, 0)

    // Estimate monthly cost (using $0.15/kWh as default)
    const estimatedMonthlyCost = Math.round(totalMonthlyKwh * 0.15 * 100) / 100

    const dashboardData = {
      tenant,
      rooms: roomsWithMetrics,
      stats: {
        totalRooms,
        totalDevices,
        totalDailyKwh: Math.round(totalDailyKwh * 100) / 100,
        totalMonthlyKwh: Math.round(totalMonthlyKwh * 100) / 100,
        estimatedMonthlyCost
      }
    }

    return { success: true, data: dashboardData }
  } catch (error) {
    console.error('Error fetching tenant dashboard:', error)
    return { success: false, error: 'Failed to fetch dashboard data. Please try again.', data: null }
  }
}