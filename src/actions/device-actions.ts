'use server'

import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const DeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required'),
  powerWatts: z.number().positive('Power must be positive'),
  usageHoursPerDay: z.number().min(0).max(24, 'Usage hours must be between 0 and 24'),
})

const DeviceArraySchema = z.array(DeviceSchema)

export interface DeviceInput {
  name: string
  powerWatts: number
  usageHoursPerDay: number
}

export async function saveDevices(tenantId: string, devices: DeviceInput[]) {
  try {
    // Validate input
    const validatedDevices = DeviceArraySchema.parse(devices)

    if (validatedDevices.length === 0) {
      return { success: false, error: 'No devices to save' }
    }

    const supabase = createServerClient()

    // Prepare data for insertion
    const deviceData = validatedDevices.map(device => ({
      tenant_id: tenantId,
      device_name: device.name,
      power_watts: device.powerWatts,
      usage_hours_per_day: device.usageHoursPerDay,
    }))

    // Insert devices into database
    const { error } = await supabase
      .from('electrical_devices')
      .insert(deviceData)

    if (error) {
      console.error('Error inserting devices:', error)
      return { success: false, error: 'Failed to save devices to database' }
    }

    // Revalidate the tenant devices page
    revalidatePath(`/tenants/${tenantId}/devices`)

    return { success: true, message: `Successfully saved ${validatedDevices.length} device(s)` }
  } catch (error) {
    console.error('Error saving devices:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid device data provided' }
    }

    return { success: false, error: 'Failed to save devices. Please try again.' }
  }
}

export async function saveDevicesToRoom(tenantId: string, roomId: string, devices: DeviceInput[]) {
  try {
    // Validate input
    const validatedDevices = DeviceArraySchema.parse(devices)

    if (validatedDevices.length === 0) {
      return { success: false, error: 'No devices to save' }
    }

    const supabase = createServerClient()

    // Prepare data for insertion
    const deviceData = validatedDevices.map(device => ({
      tenant_id: tenantId,
      room_id: roomId,
      device_name: device.name,
      power_watts: device.powerWatts,
      usage_hours_per_day: device.usageHoursPerDay,
    }))

    // Insert devices into database
    const { error } = await supabase
      .from('electrical_devices')
      .insert(deviceData)

    if (error) {
      console.error('Error inserting devices:', error)
      return { success: false, error: 'Failed to save devices to database' }
    }

    // Revalidate relevant pages
    revalidatePath(`/tenants/${tenantId}/rooms`)
    revalidatePath(`/tenants/${tenantId}/rooms/${roomId}/devices`)

    return { success: true, message: `Successfully saved ${validatedDevices.length} device(s)` }
  } catch (error) {
    console.error('Error saving devices:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid device data provided' }
    }

    return { success: false, error: 'Failed to save devices. Please try again.' }
  }
}

export async function getDevicesByTenant(tenantId: string) {
  try {
    const supabase = createServerClient()

    const { data: devices, error } = await supabase
      .from('electrical_devices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching devices:', error)
      return { success: false, error: 'Failed to fetch devices', devices: [] }
    }

    return { success: true, devices: devices || [] }
  } catch (error) {
    console.error('Error fetching devices:', error)
    return { success: false, error: 'Failed to fetch devices', devices: [] }
  }
}

export async function getDevicesByRoom(roomId: string) {
  try {
    const supabase = createServerClient()

    const { data: devices, error } = await supabase
      .from('electrical_devices')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching devices:', error)
      return { success: false, error: 'Failed to fetch devices', devices: [] }
    }

    return { success: true, devices: devices || [] }
  } catch (error) {
    console.error('Error fetching devices:', error)
    return { success: false, error: 'Failed to fetch devices', devices: [] }
  }
}