import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTenantDashboard } from '@/actions/room-actions'
import DashboardStats from '@/components/dashboard-stats'
import DashboardRoomGrid from '@/components/dashboard-room-grid'

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Link href="/tenants" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-center flex-1">{tenant.name}</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Overview Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Hotel Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Overview of all rooms and power consumption
          </p>
        </div>

        {/* Stats Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Overview</h3>
          <DashboardStats stats={stats} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3">
          <Link href={`/tenants/${tenantId}/rooms/new`}>
            <Button size="lg" className="w-full h-14 flex items-center justify-center">
              <Plus className="mr-2 h-5 w-5" />
              Add New Room
            </Button>
          </Link>

          {rooms.length > 0 && (
            <Link href={`/tenants/${tenantId}/report`}>
              <Button variant="outline" size="lg" className="w-full h-14 flex items-center justify-center">
                <FileText className="mr-2 h-5 w-5" />
                View Detailed Report
              </Button>
            </Link>
          )}
        </div>

        {/* Rooms Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              Rooms ({rooms.length})
            </h3>
          </div>
          <DashboardRoomGrid rooms={rooms} tenantId={tenantId} />
        </div>
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