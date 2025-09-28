import { Suspense } from 'react'
import { createServerClient, type Tenant, type ElectricalDevice } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function TenantPage({ params }: Props) {
  const supabase = createServerClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !tenant) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{tenant.name}</h1>
        <p className="text-muted-foreground">
          Created: {new Date(tenant.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Electrical Devices</CardTitle>
            <Button asChild size="sm">
              <Link href={`/tenant/${tenant.id}/devices/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Device
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<DevicesLoading />}>
              <DevicesContent tenantId={tenant.id} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Energy Consumption Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ConsumptionLoading />}>
              <ConsumptionSummary tenantId={tenant.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function DevicesContent({ tenantId }: { tenantId: string }) {
  const supabase = createServerClient()

  const { data: devices, error } = await supabase
    .from('electrical_devices')
    .select('*')
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error fetching devices:', error)
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading devices</p>
      </div>
    )
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No devices found</p>
        <Button asChild>
          <Link href={`/tenant/${tenantId}/devices/new`}>
            Add your first device
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  )
}

function DeviceCard({ device }: { device: ElectricalDevice }) {
  const dailyConsumption = Number(device.power_watts) * Number(device.usage_hours_per_day)
  const monthlyConsumption = dailyConsumption * 30

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{device.device_name}</h3>
          <p className="text-sm text-muted-foreground">
            {device.power_watts}W • {device.usage_hours_per_day}h/day
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {(dailyConsumption / 1000).toFixed(2)} kWh/day
          </p>
          <p className="text-xs text-muted-foreground">
            {(monthlyConsumption / 1000).toFixed(1)} kWh/month
          </p>
        </div>
      </div>
    </div>
  )
}

async function ConsumptionSummary({ tenantId }: { tenantId: string }) {
  const supabase = createServerClient()

  const { data: devices, error } = await supabase
    .from('electrical_devices')
    .select('*')
    .eq('tenant_id', tenantId)

  if (error || !devices) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading consumption data</p>
      </div>
    )
  }

  const totalDailyConsumption = devices.reduce((sum, device) => {
    return sum + (Number(device.power_watts) * Number(device.usage_hours_per_day))
  }, 0)

  const monthlyConsumption = totalDailyConsumption * 30
  const yearlyConsumption = totalDailyConsumption * 365

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <p className="text-2xl font-bold">{(totalDailyConsumption / 1000).toFixed(1)}</p>
        <p className="text-sm text-muted-foreground">kWh/day</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold">{(monthlyConsumption / 1000).toFixed(0)}</p>
        <p className="text-sm text-muted-foreground">kWh/month</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold">{(yearlyConsumption / 1000).toFixed(0)}</p>
        <p className="text-sm text-muted-foreground">kWh/year</p>
      </div>
    </div>
  )
}

function DevicesLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="h-5 bg-muted rounded animate-pulse mb-2" style={{ width: '120px' }} />
              <div className="h-4 bg-muted rounded animate-pulse" style={{ width: '80px' }} />
            </div>
            <div className="text-right">
              <div className="h-4 bg-muted rounded animate-pulse mb-1" style={{ width: '60px' }} />
              <div className="h-3 bg-muted rounded animate-pulse" style={{ width: '80px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ConsumptionLoading() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="text-center">
          <div className="h-8 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}