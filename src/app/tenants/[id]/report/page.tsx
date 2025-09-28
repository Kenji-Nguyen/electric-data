import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PowerConsumptionReport from '@/components/power-consumption-report'

interface ReportPageProps {
  params: Promise<{ id: string }>
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<ReportLoading />}>
      <ReportContent tenantId={id} />
    </Suspense>
  )
}

async function ReportContent({ tenantId }: { tenantId: string }) {
  const supabase = createServerClient()

  // Get tenant details
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (tenantError || !tenant) {
    notFound()
  }

  // Get rooms with their devices and power consumption
  const { data: roomsWithDevices, error: roomsError } = await supabase
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
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Link href={`/tenants/${tenantId}/rooms`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-semibold text-center flex-1">Power Report</h1>
            <div className="w-9" />
          </div>
        </div>
        <div className="px-4 py-6">
          <p className="text-red-500">Error loading report data: {roomsError.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Link href={`/tenants/${tenantId}/rooms`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-center flex-1">Power Report</h1>
          <div className="w-9" />
        </div>
      </div>

      <PowerConsumptionReport
        tenant={tenant}
        roomsWithDevices={roomsWithDevices || []}
      />
    </div>
  )
}

function ReportLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-6 sticky top-0 z-10">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
      </div>
      <div className="px-4 py-6">
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}