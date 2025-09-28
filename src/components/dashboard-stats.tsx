'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Home, Zap, Calendar, DollarSign } from 'lucide-react'

interface DashboardStatsProps {
  stats: {
    totalRooms: number
    totalDevices: number
    totalDailyKwh: number
    estimatedMonthlyCost: number
  }
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-bold">{stats.totalRooms}</div>
              <div className="text-xs text-gray-500">Rooms</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-lg font-bold">{stats.totalDevices}</div>
              <div className="text-xs text-gray-500">Devices</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-lg font-bold">{stats.totalDailyKwh}</div>
              <div className="text-xs text-gray-500">kWh/day</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-lg font-bold">${stats.estimatedMonthlyCost}</div>
              <div className="text-xs text-gray-500">Est. Monthly</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}