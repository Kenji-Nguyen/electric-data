import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Home, Zap, FileText } from 'lucide-react'
import { getRoomsByTenant } from '@/actions/room-actions'
import RoomCard from '@/components/room-card'
import CreateRoomDialog from '@/components/create-room-dialog'

interface RoomsPageProps {
  params: { id: string }
}

export default function RoomsPage({ params }: RoomsPageProps) {
  return (
    <Suspense fallback={<RoomsLoading />}>
      <RoomsContent tenantId={params.id} />
    </Suspense>
  )
}

async function RoomsContent({ tenantId }: { tenantId: string }) {
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

  // Get rooms for this tenant
  const roomsResult = await getRoomsByTenant(tenantId)

  if (!roomsResult.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Link href="/tenants" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-semibold text-center flex-1">{tenant.name}</h1>
            <div className="w-9" />
          </div>
        </div>
        <div className="px-4 py-6">
          <p className="text-red-500">Error loading rooms: {roomsResult.error}</p>
        </div>
      </div>
    )
  }

  const rooms = roomsResult.rooms

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
        {/* Header Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Hotel Rooms</h2>
          <p className="text-gray-600 mt-1">
            Manage rooms and their electrical devices
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3">
          <CreateRoomDialog tenantId={tenantId} />

          {rooms.length > 0 && (
            <Link href={`/tenants/${tenantId}/report`}>
              <Button variant="outline" size="lg" className="w-full h-14 flex items-center justify-center">
                <FileText className="mr-2 h-5 w-5" />
                View Power Report
              </Button>
            </Link>
          )}
        </div>

        {/* Rooms List */}
        {rooms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first room to start tracking electrical devices
              </p>
              <CreateRoomDialog tenantId={tenantId} variant="default" />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Rooms ({rooms.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {rooms.map((room: any) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  tenantId={tenantId}
                  allRooms={rooms}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RoomsLoading() {
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