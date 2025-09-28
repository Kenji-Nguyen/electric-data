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

    // Revalidate the tenant dashboard page
    revalidatePath(`/tenants/${tenantId}`)

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

export async function updateDevice(deviceId: string, deviceData: DeviceInput) {
  try {
    const validatedDevice = DeviceSchema.parse(deviceData)
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('electrical_devices')
      .update({
        device_name: validatedDevice.name,
        power_watts: validatedDevice.powerWatts,
        usage_hours_per_day: validatedDevice.usageHoursPerDay,
      })
      .eq('id', deviceId)
      .select('tenant_id, room_id')
      .single()

    if (error) {
      console.error('Error updating device:', error)
      return { success: false, error: 'Failed to update device' }
    }

    // Revalidate relevant pages
    revalidatePath(`/tenants/${data.tenant_id}`)
    revalidatePath(`/tenants/${data.tenant_id}/rooms/${data.room_id}`)
    revalidatePath(`/tenants/${data.tenant_id}/rooms/${data.room_id}/devices`)

    return { success: true, message: 'Device updated successfully' }
  } catch (error) {
    console.error('Error updating device:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid device data provided' }
    }

    return { success: false, error: 'Failed to update device. Please try again.' }
  }
}

export async function deleteDevice(deviceId: string) {
  try {
    const supabase = createServerClient()

    // Get device details for revalidation
    const { data: device, error: deviceError } = await supabase
      .from('electrical_devices')
      .select('tenant_id, room_id')
      .eq('id', deviceId)
      .single()

    if (deviceError || !device) {
      return { success: false, error: 'Device not found' }
    }

    const { error } = await supabase
      .from('electrical_devices')
      .delete()
      .eq('id', deviceId)

    if (error) {
      console.error('Error deleting device:', error)
      return { success: false, error: 'Failed to delete device' }
    }

    // Revalidate relevant pages
    revalidatePath(`/tenants/${device.tenant_id}`)
    revalidatePath(`/tenants/${device.tenant_id}/rooms/${device.room_id}`)
    revalidatePath(`/tenants/${device.tenant_id}/rooms/${device.room_id}/devices`)

    return { success: true, message: 'Device deleted successfully' }
  } catch (error) {
    console.error('Error deleting device:', error)
    return { success: false, error: 'Failed to delete device. Please try again.' }
  }
}