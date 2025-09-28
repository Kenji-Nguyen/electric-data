'use server'

import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const DeviceSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
  deviceName: z.string().min(1, 'Device name is required').max(255, 'Device name too long'),
  powerWatts: z.coerce.number().min(0, 'Power must be positive'),
  usageHoursPerDay: z.coerce.number().min(0, 'Usage hours must be positive').max(24, 'Usage hours cannot exceed 24'),
})

export async function createDeviceAction(formData: FormData) {
  const validatedFields = DeviceSchema.safeParse({
    tenantId: formData.get('tenantId'),
    deviceName: formData.get('deviceName'),
    powerWatts: formData.get('powerWatts'),
    usageHoursPerDay: formData.get('usageHoursPerDay'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = createServerClient()

    const { data: device, error } = await supabase
      .from('electrical_devices')
      .insert({
        tenant_id: validatedFields.data.tenantId,
        device_name: validatedFields.data.deviceName,
        power_watts: validatedFields.data.powerWatts,
        usage_hours_per_day: validatedFields.data.usageHoursPerDay,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return {
        errors: { _form: ['Failed to create device'] },
      }
    }

    revalidatePath(`/tenant/${validatedFields.data.tenantId}`)
    revalidatePath('/tenants')

    return { success: true, deviceId: device.id }
  } catch (error) {
    console.error('Failed to create device:', error)
    return {
      errors: { _form: ['Failed to create device'] },
    }
  }
}

export async function updateDeviceAction(deviceId: string, formData: FormData) {
  const validatedFields = DeviceSchema.omit({ tenantId: true }).safeParse({
    deviceName: formData.get('deviceName'),
    powerWatts: formData.get('powerWatts'),
    usageHoursPerDay: formData.get('usageHoursPerDay'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('electrical_devices')
      .update({
        device_name: validatedFields.data.deviceName,
        power_watts: validatedFields.data.powerWatts,
        usage_hours_per_day: validatedFields.data.usageHoursPerDay,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId)

    if (error) {
      console.error('Supabase error:', error)
      return {
        errors: { _form: ['Failed to update device'] },
      }
    }

    revalidatePath('/tenants')
    return { success: true }
  } catch (error) {
    console.error('Failed to update device:', error)
    return {
      errors: { _form: ['Failed to update device'] },
    }
  }
}

export async function deleteDeviceAction(deviceId: string) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('electrical_devices')
      .delete()
      .eq('id', deviceId)

    if (error) {
      console.error('Supabase error:', error)
      return {
        errors: { _form: ['Failed to delete device'] },
      }
    }

    revalidatePath('/tenants')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete device:', error)
    return {
      errors: { _form: ['Failed to delete device'] },
    }
  }
}