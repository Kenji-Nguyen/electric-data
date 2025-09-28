'use client'

import { createTenantAction } from '@/actions/tenants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export function CreateTenantForm() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)

    try {
      await createTenantAction(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Tenant Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          required
          placeholder="Enter tenant name"
          disabled={isPending}
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Creating...' : 'Create Tenant'}
      </Button>
    </form>
  )
}