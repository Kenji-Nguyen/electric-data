'use server'

import { db } from '@/lib/db'
import { tenants } from '@/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const CreateTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name must be less than 255 characters'),
})

export async function createTenantAction(formData: FormData) {
  const validatedFields = CreateTenantSchema.safeParse({
    name: formData.get('name'),
  })

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.errors[0].message)
  }

  try {
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: validatedFields.data.name,
      })
      .returning()

    revalidatePath('/tenants')
    redirect(`/tenant/${tenant.id}`)
  } catch (error) {
    console.error('Failed to create tenant:', error)
    throw new Error('Failed to create tenant')
  }
}

export async function updateTenantAction(tenantId: string, formData: FormData) {
  const validatedFields = CreateTenantSchema.safeParse({
    name: formData.get('name'),
  })

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.errors[0].message)
  }

  try {
    await db
      .update(tenants)
      .set({
        name: validatedFields.data.name,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId))

    revalidatePath('/tenants')
    revalidatePath(`/tenant/${tenantId}`)
  } catch (error) {
    console.error('Failed to update tenant:', error)
    throw new Error('Failed to update tenant')
  }
}

export async function deleteTenantAction(tenantId: string) {
  try {
    // Note: This assumes CASCADE DELETE is set up in the database
    // Otherwise, you'd need to delete devices first
    await db
      .delete(tenants)
      .where(eq(tenants.id, tenantId))

    revalidatePath('/tenants')
    redirect('/tenants')
  } catch (error) {
    console.error('Failed to delete tenant:', error)
    throw new Error('Failed to delete tenant')
  }
}