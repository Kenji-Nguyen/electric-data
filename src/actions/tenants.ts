'use server'

import { createServerClient } from '@/lib/supabase'
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
    throw new Error(validatedFields.error.issues[0].message)
  }

  const supabase = createServerClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      name: validatedFields.data.name,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    throw new Error('Failed to create tenant')
  }

  revalidatePath('/tenants')
  redirect(`/tenants/${tenant.id}`)
}

export async function updateTenantAction(tenantId: string, formData: FormData) {
  const validatedFields = CreateTenantSchema.safeParse({
    name: formData.get('name'),
  })

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.issues[0].message)
  }

  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('tenants')
      .update({
        name: validatedFields.data.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Failed to update tenant')
    }

    revalidatePath('/tenants')
    revalidatePath(`/tenants/${tenantId}`)
  } catch (error) {
    console.error('Failed to update tenant:', error)
    throw new Error('Failed to update tenant')
  }
}

export async function deleteTenantAction(tenantId: string) {
  const supabase = createServerClient()

  // Note: This assumes CASCADE DELETE is set up in the database
  // Otherwise, you'd need to delete devices first
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', tenantId)

  if (error) {
    console.error('Supabase error:', error)
    throw new Error('Failed to delete tenant')
  }

  revalidatePath('/tenants')
  redirect('/tenants')
}