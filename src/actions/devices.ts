'use server'

import { db } from '@/lib/db'
import { electricalDevices } from '@/schema'
import { eq } from 'drizzle-orm'
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
    const [device] = await db
      .insert(electricalDevices)
      .values({
        ...validatedFields.data,
        powerWatts: validatedFields.data.powerWatts.toString(),
        usageHoursPerDay: validatedFields.data.usageHoursPerDay.toString(),
      })
      .returning()

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
    await db
      .update(electricalDevices)
      .set({
        deviceName: validatedFields.data.deviceName,
        powerWatts: validatedFields.data.powerWatts.toString(),
        usageHoursPerDay: validatedFields.data.usageHoursPerDay.toString(),
        updatedAt: new Date(),
      })
      .where(eq(electricalDevices.id, deviceId))

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
    await db
      .delete(electricalDevices)
      .where(eq(electricalDevices.id, deviceId))

    revalidatePath('/tenants')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete device:', error)
    return {
      errors: { _form: ['Failed to delete device'] },
    }
  }
}