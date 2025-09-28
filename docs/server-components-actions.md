# Server Components & Server Actions Guide

This document explains how data fetching and mutations work in Next.js App Router using Server Components and Server Actions, replacing the need for traditional API routes and client-side data fetching.

## Server Components for Data Access

Server Components run on the server and can directly access databases, APIs, and other server-side resources. They replace the need for traditional data fetching patterns.

### Basic Data Fetching

```typescript
// src/app/tenants/page.tsx
import { db } from '@/lib/db'
import { tenants } from '@/schema'
import { desc } from 'drizzle-orm'

export default async function TenantsPage() {
  // Direct database access in Server Component
  const tenantsList = await db
    .select()
    .from(tenants)
    .orderBy(desc(tenants.createdAt))

  return (
    <div>
      <h1>Tenants</h1>
      <div className="grid gap-4">
        {tenantsList.map(tenant => (
          <TenantCard key={tenant.id} tenant={tenant} />
        ))}
      </div>
    </div>
  )
}
```

### Relational Data Fetching

```typescript
// src/app/tenant/[id]/page.tsx
import { db } from '@/lib/db'
import { tenants, electricalDevices } from '@/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

interface Props {
  params: { id: string }
}

export default async function TenantPage({ params }: Props) {
  // Fetch tenant with their devices
  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, params.id))
    .then(rows => rows[0])

  if (!tenant) {
    notFound()
  }

  const devices = await db
    .select()
    .from(electricalDevices)
    .where(eq(electricalDevices.tenantId, tenant.id))

  return (
    <div>
      <h1>{tenant.name}</h1>
      <DevicesList devices={devices} />
    </div>
  )
}
```

### Complex Queries with Joins

```typescript
// src/app/dashboard/page.tsx
import { db } from '@/lib/db'
import { tenants, electricalDevices } from '@/schema'
import { sql, eq, sum } from 'drizzle-orm'

export default async function DashboardPage() {
  // Complex aggregation query
  const tenantsWithConsumption = await db
    .select({
      tenantId: tenants.id,
      tenantName: tenants.name,
      totalDevices: sql<number>`count(${electricalDevices.id})`.as('total_devices'),
      totalPowerWatts: sum(electricalDevices.powerWatts).as('total_power'),
    })
    .from(tenants)
    .leftJoin(electricalDevices, eq(tenants.id, electricalDevices.tenantId))
    .groupBy(tenants.id, tenants.name)

  return (
    <div>
      <h1>Energy Dashboard</h1>
      <ConsumptionChart data={tenantsWithConsumption} />
    </div>
  )
}
```

### Error Handling in Server Components

```typescript
// src/app/tenant/[id]/devices/page.tsx
import { db } from '@/lib/db'
import { tenants, electricalDevices } from '@/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

export default async function TenantDevicesPage({ params }: { params: { id: string } }) {
  try {
    // Verify tenant exists
    const tenant = await db
      .select({ id: tenants.id, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, params.id))
      .then(rows => rows[0])

    if (!tenant) {
      notFound()
    }

    const devices = await db
      .select()
      .from(electricalDevices)
      .where(eq(electricalDevices.tenantId, params.id))

    return (
      <div>
        <h1>{tenant.name} - Devices</h1>
        <DevicesList devices={devices} />
      </div>
    )
  } catch (error) {
    console.error('Failed to fetch tenant devices:', error)
    throw new Error('Failed to load tenant devices')
  }
}
```

## Server Actions for Data Mutations

Server Actions handle form submissions, data mutations, and business logic on the server without requiring API routes.

### Basic CRUD Operations

```typescript
// src/actions/tenants.ts
'use server'

import { db } from '@/lib/db'
import { tenants } from '@/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const CreateTenantSchema = z.object({
  name: z.string().min(2).max(255),
})

export async function createTenantAction(formData: FormData) {
  // Validate input data
  const validatedFields = CreateTenantSchema.safeParse({
    name: formData.get('name'),
  })

  if (!validatedFields.success) {
    throw new Error('Invalid tenant name')
  }

  try {
    // Insert new tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: validatedFields.data.name,
      })
      .returning()

    // Revalidate affected pages
    revalidatePath('/tenants')

    // Redirect to new tenant page
    redirect(`/tenant/${tenant.id}`)
  } catch (error) {
    throw new Error('Failed to create tenant')
  }
}

export async function updateTenantAction(tenantId: string, formData: FormData) {
  const validatedFields = CreateTenantSchema.safeParse({
    name: formData.get('name'),
  })

  if (!validatedFields.success) {
    throw new Error('Invalid tenant name')
  }

  await db
    .update(tenants)
    .set({
      name: validatedFields.data.name,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId))

  revalidatePath('/tenants')
  revalidatePath(`/tenant/${tenantId}`)
}

export async function deleteTenantAction(tenantId: string) {
  // Delete associated devices first (if not using CASCADE)
  await db
    .delete(electricalDevices)
    .where(eq(electricalDevices.tenantId, tenantId))

  // Delete tenant
  await db
    .delete(tenants)
    .where(eq(tenants.id, tenantId))

  revalidatePath('/tenants')
  redirect('/tenants')
}
```

### Device Management Actions

```typescript
// src/actions/devices.ts
'use server'

import { db } from '@/lib/db'
import { electricalDevices } from '@/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const DeviceSchema = z.object({
  tenantId: z.string().uuid(),
  deviceName: z.string().min(1).max(255),
  powerWatts: z.coerce.number().min(0),
  usageHoursPerDay: z.coerce.number().min(0).max(24),
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
      .values(validatedFields.data)
      .returning()

    revalidatePath(`/tenant/${validatedFields.data.tenantId}`)
    return { success: true, deviceId: device.id }
  } catch (error) {
    return {
      errors: { _form: ['Failed to create device'] },
    }
  }
}

export async function updateDeviceAction(deviceId: string, formData: FormData) {
  const validatedFields = DeviceSchema.partial().safeParse({
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
        ...validatedFields.data,
        updatedAt: new Date(),
      })
      .where(eq(electricalDevices.id, deviceId))

    revalidatePath('/tenants')
    return { success: true }
  } catch (error) {
    return {
      errors: { _form: ['Failed to update device'] },
    }
  }
}
```

### Advanced Server Action Patterns

```typescript
// src/actions/analytics.ts
'use server'

import { db } from '@/lib/db'
import { tenants, electricalDevices } from '@/schema'
import { eq, sql } from 'drizzle-orm'

export async function calculateEnergyConsumptionAction(tenantId: string) {
  // Complex business logic in Server Action
  const devices = await db
    .select()
    .from(electricalDevices)
    .where(eq(electricalDevices.tenantId, tenantId))

  const calculations = devices.map(device => {
    const dailyConsumption = Number(device.powerWatts) * Number(device.usageHoursPerDay)
    const monthlyConsumption = dailyConsumption * 30
    const annualConsumption = dailyConsumption * 365

    return {
      deviceId: device.id,
      deviceName: device.deviceName,
      dailyKwh: dailyConsumption / 1000,
      monthlyKwh: monthlyConsumption / 1000,
      annualKwh: annualConsumption / 1000,
    }
  })

  const totals = calculations.reduce(
    (acc, calc) => ({
      dailyKwh: acc.dailyKwh + calc.dailyKwh,
      monthlyKwh: acc.monthlyKwh + calc.monthlyKwh,
      annualKwh: acc.annualKwh + calc.annualKwh,
    }),
    { dailyKwh: 0, monthlyKwh: 0, annualKwh: 0 }
  )

  return {
    devices: calculations,
    totals,
  }
}

export async function bulkUpdateDevicesAction(
  deviceUpdates: Array<{ id: string; powerWatts: number; usageHoursPerDay: number }>
) {
  try {
    // Perform bulk updates in a transaction
    await db.transaction(async (tx) => {
      for (const update of deviceUpdates) {
        await tx
          .update(electricalDevices)
          .set({
            powerWatts: update.powerWatts.toString(),
            usageHoursPerDay: update.usageHoursPerDay.toString(),
            updatedAt: new Date(),
          })
          .where(eq(electricalDevices.id, update.id))
      }
    })

    revalidatePath('/tenants')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update devices' }
  }
}
```

## Form Components Using Server Actions

### Basic Form Component

```typescript
// src/components/create-tenant-form.tsx
'use client'

import { useActionState } from 'react'
import { createTenantAction } from '@/actions/tenants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateTenantForm() {
  const [state, formAction] = useActionState(createTenantAction, null)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Tenant Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          required
          placeholder="Enter tenant name"
        />
      </div>

      <Button type="submit">Create Tenant</Button>
    </form>
  )
}
```

### Advanced Form with Validation

```typescript
// src/components/create-device-form.tsx
'use client'

import { useActionState } from 'react'
import { createDeviceAction } from '@/actions/devices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  tenantId: string
}

export function CreateDeviceForm({ tenantId }: Props) {
  const [state, formAction] = useActionState(createDeviceAction, null)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tenantId" value={tenantId} />

      <div>
        <Label htmlFor="deviceName">Device Name</Label>
        <Input
          type="text"
          id="deviceName"
          name="deviceName"
          required
          placeholder="e.g., Air Conditioner"
        />
        {state?.errors?.deviceName && (
          <p className="text-red-500 text-sm">{state.errors.deviceName[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="powerWatts">Power (Watts)</Label>
        <Input
          type="number"
          id="powerWatts"
          name="powerWatts"
          required
          min="0"
          step="0.01"
          placeholder="e.g., 1500"
        />
        {state?.errors?.powerWatts && (
          <p className="text-red-500 text-sm">{state.errors.powerWatts[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="usageHoursPerDay">Usage Hours Per Day</Label>
        <Input
          type="number"
          id="usageHoursPerDay"
          name="usageHoursPerDay"
          required
          min="0"
          max="24"
          step="0.1"
          placeholder="e.g., 8.5"
        />
        {state?.errors?.usageHoursPerDay && (
          <p className="text-red-500 text-sm">{state.errors.usageHoursPerDay[0]}</p>
        )}
      </div>

      <Button type="submit">Add Device</Button>

      {state?.errors?._form && (
        <p className="text-red-500 text-sm">{state.errors._form[0]}</p>
      )}

      {state?.success && (
        <p className="text-green-500 text-sm">Device created successfully!</p>
      )}
    </form>
  )
}
```

## Loading and Error States

### Loading States with Suspense

```typescript
// src/app/tenants/page.tsx
import { Suspense } from 'react'
import { TenantsLoading } from '@/components/tenants-loading'

export default function TenantsPage() {
  return (
    <div>
      <h1>Tenants</h1>
      <Suspense fallback={<TenantsLoading />}>
        <TenantsContent />
      </Suspense>
    </div>
  )
}

async function TenantsContent() {
  const tenants = await db.select().from(tenantsTable)
  return <TenantsList tenants={tenants} />
}
```

### Error Boundaries

```typescript
// src/app/tenant/[id]/error.tsx
'use client'

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-lg font-semibold">Something went wrong!</h2>
      <p className="text-muted-foreground mb-4">
        Failed to load tenant information.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

## Performance Optimization

### Data Fetching Patterns

```typescript
// Parallel data fetching
export default async function TenantDashboard({ params }: { params: { id: string } }) {
  // Fetch data in parallel
  const [tenant, devices, analytics] = await Promise.all([
    getTenant(params.id),
    getDevices(params.id),
    getAnalytics(params.id),
  ])

  return (
    <div>
      <TenantHeader tenant={tenant} />
      <DevicesSection devices={devices} />
      <AnalyticsSection analytics={analytics} />
    </div>
  )
}
```

### Cache Revalidation Strategies

```typescript
// Time-based revalidation
export const revalidate = 3600 // Revalidate every hour

// Tag-based revalidation
export async function getTenants() {
  return await fetch('/api/tenants', {
    next: { tags: ['tenants'] }
  })
}

// In Server Action
revalidateTag('tenants')
```

This architecture provides efficient, type-safe data handling with excellent performance characteristics and developer experience while leveraging the full power of Next.js App Router.