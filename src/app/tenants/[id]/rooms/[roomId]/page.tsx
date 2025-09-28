import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDevicesByRoom } from '@/actions/device-actions'

interface RoomDetailPageProps {
  params: Promise<{ id: string; roomId: string }>
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { id: tenantId, roomId } = await params

  return (
    <Suspense fallback={<RoomDetailLoading />}>
      <RoomDetailContent tenantId={tenantId} roomId={roomId} />
    </Suspense>
  )
}

async function RoomDetailContent({ tenantId, roomId }: { tenantId: string; roomId: string }) {
  const supabase = createServerClient()

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

  // Get tenant details
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single()

  // Get devices for this room
  const devicesResult = await getDevicesByRoom(roomId)
  const devices = devicesResult.success ? devicesResult.devices : []

  // Calculate power metrics
  const dailyWattHours = devices.reduce((total, device) => {
    return total + (device.power_watts * device.usage_hours_per_day)
  }, 0)

  const dailyKwh = dailyWattHours / 1000
  const monthlyKwh = dailyKwh * 30
  const yearlyKwh = dailyKwh * 365
  const estimatedMonthlyCost = monthlyKwh * 0.15

  // Health status
  let healthStatus: 'good' | 'moderate' | 'high' = 'good'
  let healthColor = 'bg-green-500'
  let healthText = 'Efficient'

  if (dailyKwh > 20) {
    healthStatus = 'high'
    healthColor = 'bg-red-500'
    healthText = 'High Usage'
  } else if (dailyKwh > 10) {
    healthStatus = 'moderate'
    healthColor = 'bg-yellow-500'
    healthText = 'Moderate'
  }

  const getRoomTypeColor = (roomType: string | null) => {
    switch (roomType?.toLowerCase()) {
      case 'standard':
        return 'bg-blue-100 text-blue-800'
      case 'deluxe':
        return 'bg-purple-100 text-purple-800'
      case 'suite':
        return 'bg-yellow-100 text-yellow-800'
      case 'conference room':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoomTypeIcon = (roomType: string | null) => {
    switch (roomType?.toLowerCase()) {
      case 'conference room':
        return '🏢'
      case 'suite':
        return '👑'
      case 'deluxe':
        return '⭐'
      default:
        return '🏠'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/tenants/${tenantId}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-center flex-1">Room {room.room_number}</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Room Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getRoomTypeIcon(room.room_type)}
                </div>
                <div>
                  <CardTitle className="text-xl">{room.room_number}</CardTitle>
                  {room.room_type && (
                    <Badge
                      variant="secondary"
                      className={`mt-1 ${getRoomTypeColor(room.room_type)}`}
                    >
                      {room.room_type}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${healthColor}`} />
                <span className="text-sm font-medium">{healthText}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Power Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{devices.length}</div>
                <div className="text-sm text-blue-600">Device{devices.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dailyKwh.toFixed(1)}</div>
                <div className="text-sm text-green-600">kWh/day</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{monthlyKwh.toFixed(0)}</div>
                <div className="text-sm text-yellow-600">kWh/month</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">${estimatedMonthlyCost.toFixed(0)}</div>
                <div className="text-sm text-red-600">Est. Monthly</div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3">
          <Link href={`/tenants/${tenantId}/rooms/${roomId}/devices`}>
            <Button size="lg" className="w-full h-12 flex items-center justify-center">
              <Plus className="mr-2 h-4 w-4" />
              {devices.length > 0 ? 'Manage Devices' : 'Add Devices'}
            </Button>
          </Link>
        </div>

        {/* Devices List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              Devices ({devices.length})
            </h3>
          </div>

          {devices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No devices yet</h3>
                <p className="text-gray-500 mb-6">
                  Add electrical devices to track power consumption for this room
                </p>
                <Link href={`/tenants/${tenantId}/rooms/${roomId}/devices`}>
                  <Button>Add Your First Device</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => {
                const deviceDailyKwh = (device.power_watts * device.usage_hours_per_day) / 1000
                const deviceMonthlyCost = deviceDailyKwh * 30 * 0.15

                return (
                  <Card key={device.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{device.device_name}</h4>
                          <div className="text-sm text-gray-500">
                            {device.power_watts}W • {device.usage_hours_per_day}h/day
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{deviceDailyKwh.toFixed(2)} kWh/day</div>
                          <div className="text-sm text-gray-500">${deviceMonthlyCost.toFixed(2)}/month</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RoomDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
      </div>
      <div className="px-4 py-6 space-y-6">
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}