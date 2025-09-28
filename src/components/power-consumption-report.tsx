'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Zap, DollarSign, Calendar, BarChart3, Home } from 'lucide-react'
import { Tenant, Room, ElectricalDevice } from '@/lib/supabase'

interface RoomWithDevices extends Room {
  electrical_devices: ElectricalDevice[]
}

interface PowerConsumptionReportProps {
  tenant: Tenant
  roomsWithDevices: RoomWithDevices[]
}

interface RoomConsumption {
  room: Room
  deviceCount: number
  dailyKwh: number
  monthlyKwh: number
  yearlyKwh: number
  yearlyCost: number
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

export default function PowerConsumptionReport({ tenant, roomsWithDevices }: PowerConsumptionReportProps) {
  const [pricePerKwh, setPricePerKwh] = useState<string>('0.15')

  const calculateRoomConsumption = (room: RoomWithDevices, price: number): RoomConsumption => {
    const devices = room.electrical_devices || []

    // Calculate daily consumption for all devices in the room
    const dailyWattHours = devices.reduce((total, device) => {
      return total + (device.power_watts * device.usage_hours_per_day)
    }, 0)

    const dailyKwh = dailyWattHours / 1000 // Convert Wh to kWh
    const monthlyKwh = dailyKwh * 30
    const yearlyKwh = dailyKwh * 365
    const yearlyCost = yearlyKwh * price

    return {
      room,
      deviceCount: devices.length,
      dailyKwh,
      monthlyKwh,
      yearlyKwh,
      yearlyCost
    }
  }

  const price = parseFloat(pricePerKwh) || 0
  const roomConsumptions = roomsWithDevices.map(room => calculateRoomConsumption(room, price))

  // Calculate totals
  const totals = roomConsumptions.reduce(
    (acc, room) => ({
      devices: acc.devices + room.deviceCount,
      dailyKwh: acc.dailyKwh + room.dailyKwh,
      monthlyKwh: acc.monthlyKwh + room.monthlyKwh,
      yearlyKwh: acc.yearlyKwh + room.yearlyKwh,
      yearlyCost: acc.yearlyCost + room.yearlyCost
    }),
    { devices: 0, dailyKwh: 0, monthlyKwh: 0, yearlyKwh: 0, yearlyCost: 0 }
  )

  // Sort rooms by yearly consumption (highest first)
  const sortedRooms = [...roomConsumptions].sort((a, b) => b.yearlyKwh - a.yearlyKwh)

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 1. OVERVIEW - Summary Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Hotel Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {roomsWithDevices.length}
              </div>
              <div className="text-sm text-gray-500">Total Rooms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {totals.devices}
              </div>
              <div className="text-sm text-gray-500">Total Devices</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Daily Consumption:</span>
              <span className="font-semibold">{totals.dailyKwh.toFixed(2)} kWh</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Monthly Consumption:</span>
              <span className="font-semibold">{totals.monthlyKwh.toFixed(2)} kWh</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Yearly Consumption:</span>
              <span className="font-semibold">{totals.yearlyKwh.toFixed(2)} kWh</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Estimated Yearly Cost:</span>
              <span className="font-bold text-red-600">
                ${totals.yearlyCost.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. ROOMS - Quick Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Rooms Overview</h3>

        {sortedRooms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms with devices</h3>
              <p className="text-gray-500">
                Add devices to rooms to see power consumption analysis
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedRooms.map((roomData) => {
              const { room, deviceCount, dailyKwh, yearlyKwh, yearlyCost } = roomData
              const percentageOfTotal = totals.yearlyKwh > 0 ? (yearlyKwh / totals.yearlyKwh) * 100 : 0

              return (
                <Card key={room.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="text-lg">
                          {getRoomTypeIcon(room.room_type)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{room.room_number}</h4>
                          {room.room_type && (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getRoomTypeColor(room.room_type)}`}
                            >
                              {room.room_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-600">
                          {percentageOfTotal.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{deviceCount} devices</span>
                        <span className="font-medium">{dailyKwh.toFixed(1)} kWh/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Yearly cost</span>
                        <span className="font-medium text-green-600">${yearlyCost.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {totals.yearlyKwh > 0 && (
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(percentageOfTotal, 100)}%` }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. DETAILED REPORT - Electricity Rate & Full Breakdown */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Detailed Analysis</h3>

        {/* Electricity Price Input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Electricity Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="pricePerKwh">Price per kWh ($)</Label>
              <Input
                id="pricePerKwh"
                type="number"
                step="0.01"
                value={pricePerKwh}
                onChange={(e) => setPricePerKwh(e.target.value)}
                placeholder="0.15"
                className="h-12 text-lg"
              />
              <p className="text-sm text-gray-500">
                Enter your local electricity rate per kilowatt-hour
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Room Breakdown */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold">Complete Room Breakdown</h4>

          <div className="space-y-4">
            {sortedRooms.map((roomData) => {
              const { room, deviceCount, dailyKwh, monthlyKwh, yearlyKwh, yearlyCost } = roomData
              const percentageOfTotal = totals.yearlyKwh > 0 ? (yearlyKwh / totals.yearlyKwh) * 100 : 0

              return (
                <Card key={room.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getRoomTypeIcon(room.room_type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{room.room_number}</CardTitle>
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
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {percentageOfTotal.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">of total</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <Zap className="mr-1 h-4 w-4" />
                        {deviceCount} device{deviceCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {dailyKwh.toFixed(2)} kWh/day
                      </span>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Monthly</div>
                        <div className="text-gray-600">{monthlyKwh.toFixed(2)} kWh</div>
                      </div>
                      <div>
                        <div className="font-medium">Yearly</div>
                        <div className="text-gray-600">{yearlyKwh.toFixed(2)} kWh</div>
                      </div>
                    </div>

                    <div className="text-center pt-2 border-t">
                      <div className="text-lg font-bold text-green-600">
                        ${yearlyCost.toFixed(2)}/year
                      </div>
                    </div>

                    {/* Progress bar for relative consumption */}
                    {totals.yearlyKwh > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(percentageOfTotal, 100)}%` }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}