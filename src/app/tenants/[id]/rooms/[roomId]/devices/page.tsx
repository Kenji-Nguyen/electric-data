import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RoomDeviceInputForm from '@/components/room-device-input-form'

interface RoomDeviceInputPageProps {
  params: Promise<{ id: string; roomId: string }>
}

export default async function RoomDeviceInputPage({ params }: RoomDeviceInputPageProps) {
  const { id, roomId } = await params

  return (
    <Suspense fallback={<DeviceInputLoading />}>
      <DeviceInputContent tenantId={id} roomId={roomId} />
    </Suspense>
  )
}

async function DeviceInputContent({ tenantId, roomId }: { tenantId: string; roomId: string }) {
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

  // Get room details
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .eq('tenant_id', tenantId)
    .single()

  if (roomError || !room) {
    notFound()
  }

  // Get existing devices for this room
  const { data: existingDevices } = await supabase
    .from('electrical_devices')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })

  return (
    <RoomDeviceInputForm
      tenant={tenant}
      room={room}
      existingDevices={existingDevices || []}
    />
  )
}

function DeviceInputLoading() {
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