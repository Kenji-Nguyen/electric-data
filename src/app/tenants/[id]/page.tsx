import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getTenantDashboard } from '@/actions/room-actions'
import { createServerClient } from '@/lib/supabase'
import DashboardStats from '@/components/dashboard-stats'
import DashboardRoomGrid from '@/components/dashboard-room-grid'
import PowerConsumptionReport from '@/components/power-consumption-report'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TenantDashboardPage({ params }: Props) {
  const { id } = await params

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent tenantId={id} />
    </Suspense>
  )
}

async function DashboardContent({ tenantId }: { tenantId: string }) {
  const result = await getTenantDashboard(tenantId)

  if (!result.success || !result.data) {
    notFound()
  }

  const { tenant, rooms, stats } = result.data

  // Fetch detailed room data for the report tab
  const supabase = createServerClient()
  const { data: roomsWithDevices } = await supabase
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/tenants" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-center flex-1">{tenant.name}</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Overview Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Hotel Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Overview of all rooms and power consumption
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            {/* Desktop Layout */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 space-y-6 lg:space-y-0">

              {/* Main Content - Rooms Grid */}
              <div className="lg:col-span-8 space-y-6">
                {/* Rooms Grid */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Rooms ({rooms.length})
                    </h3>
                  </div>
                  <DashboardRoomGrid rooms={rooms} tenantId={tenantId} />
                </div>
              </div>

              {/* Sidebar - Stats & Actions */}
              <div className="lg:col-span-4 space-y-6">
                {/* Stats Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Overview</h3>
                  <DashboardStats stats={stats} />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-3">
                  <Link href={`/tenants/${tenantId}/rooms/new`}>
                    <Button size="lg" className="w-full h-12 lg:h-14 flex items-center justify-center">
                      <Plus className="mr-2 h-5 w-5" />
                      Add New Room
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <PowerConsumptionReport
              tenant={tenant}
              roomsWithDevices={roomsWithDevices || []}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
      </div>
      <div className="px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mx-auto" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}