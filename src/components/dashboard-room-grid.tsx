'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'
import Link from 'next/link'

interface RoomWithMetrics {
  id: string
  room_number: string
  room_type: string | null
  deviceCount: number
  dailyKwh: number
  healthStatus: 'good' | 'moderate' | 'high'
}

interface DashboardRoomGridProps {
  rooms: RoomWithMetrics[]
  tenantId: string
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

const getHealthColor = (status: 'good' | 'moderate' | 'high') => {
  switch (status) {
    case 'good':
      return 'bg-green-500'
    case 'moderate':
      return 'bg-yellow-500'
    case 'high':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const getHealthText = (status: 'good' | 'moderate' | 'high') => {
  switch (status) {
    case 'good':
      return 'Efficient'
    case 'moderate':
      return 'Moderate'
    case 'high':
      return 'High Usage'
    default:
      return 'Unknown'
  }
}

export default function DashboardRoomGrid({ rooms, tenantId }: DashboardRoomGridProps) {
  if (rooms.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first room to start tracking electrical devices
          </p>
          <Link
            href={`/tenants/${tenantId}/rooms/new`}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Add Your First Room
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {rooms.map((room) => (
        <Link key={room.id} href={`/tenants/${tenantId}/rooms/${room.id}`}>
          <Card className="hover:shadow-md transition-shadow w-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Left side - Room info */}
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getRoomTypeIcon(room.room_type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold">{room.room_number}</h3>
                      {room.room_type && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getRoomTypeColor(room.room_type)}`}
                        >
                          {room.room_type}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Zap className="mr-1 h-3 w-3" />
                        <span>{room.deviceCount} device{room.deviceCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className={`flex items-center space-x-1`}>
                        <div className={`w-2 h-2 rounded-full ${getHealthColor(room.healthStatus)}`} />
                        <span>{getHealthText(room.healthStatus)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Power usage */}
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {room.dailyKwh} kWh
                  </div>
                  <div className="text-sm text-gray-500">per day</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}