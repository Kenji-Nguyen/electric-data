'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Zap, Clock, Package, Home } from 'lucide-react'
import Link from 'next/link'
import { Tenant } from '@/lib/supabase'
import { saveDevices, saveDevicesToRoom, type DeviceInput } from '@/actions/device-actions'
import { getRoomsByTenant, type Room } from '@/actions/room-actions'

interface Device {
  id: string
  name: string
  powerWatts: string
  usageHoursPerDay: string
}

interface DeviceTemplate {
  name: string
  powerWatts: number
  category: string
  icon: string
}

const deviceTemplates: DeviceTemplate[] = [
  { name: 'LED Bulb', powerWatts: 10, category: 'Lighting', icon: '💡' },
  { name: 'Ceiling Fan', powerWatts: 75, category: 'HVAC', icon: '🌀' },
  { name: 'Air Conditioner', powerWatts: 2000, category: 'HVAC', icon: '❄️' },
  { name: 'Refrigerator', powerWatts: 150, category: 'Kitchen', icon: '🧊' },
  { name: 'Microwave', powerWatts: 1000, category: 'Kitchen', icon: '📱' },
  { name: 'Television', powerWatts: 100, category: 'Electronics', icon: '📺' },
  { name: 'Computer', powerWatts: 300, category: 'Electronics', icon: '💻' },
  { name: 'Coffee Maker', powerWatts: 800, category: 'Kitchen', icon: '☕' },
]

const categories = ['All', 'Lighting', 'HVAC', 'Kitchen', 'Electronics']

interface DeviceInputFormProps {
  tenant: Tenant
}

export default function DeviceInputForm({ tenant }: DeviceInputFormProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [currentDevice, setCurrentDevice] = useState({
    name: '',
    powerWatts: '',
    usageHoursPerDay: ''
  })
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedRoom, setSelectedRoom] = useState<string>('none')
  const [rooms, setRooms] = useState<Room[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)

  // Load rooms when component mounts
  useEffect(() => {
    async function loadRooms() {
      setIsLoadingRooms(true)
      try {
        const result = await getRoomsByTenant(tenant.id)
        if (result.success) {
          setRooms(result.rooms)
        } else {
          console.error('Failed to load rooms:', result.error)
        }
      } catch (error) {
        console.error('Error loading rooms:', error)
      } finally {
        setIsLoadingRooms(false)
      }
    }
    loadRooms()
  }, [tenant.id])

  const filteredTemplates = selectedCategory === 'All'
    ? deviceTemplates
    : deviceTemplates.filter(template => template.category === selectedCategory)

  const addDevice = () => {
    if (!currentDevice.name || !currentDevice.powerWatts || !currentDevice.usageHoursPerDay) {
      return
    }

    const newDevice: Device = {
      id: Date.now().toString(),
      ...currentDevice
    }

    setDevices([...devices, newDevice])
    setCurrentDevice({ name: '', powerWatts: '', usageHoursPerDay: '' })
  }

  const removeDevice = (id: string) => {
    setDevices(devices.filter(device => device.id !== id))
  }


  const saveAllDevices = async () => {
    if (devices.length === 0) return

    setIsSubmitting(true)

    try {
      const deviceInputs: DeviceInput[] = devices.map(device => ({
        name: device.name,
        powerWatts: parseFloat(device.powerWatts),
        usageHoursPerDay: parseFloat(device.usageHoursPerDay)
      }))

      let result
      if (selectedRoom && selectedRoom !== 'none') {
        // Save devices to specific room
        result = await saveDevicesToRoom(tenant.id, selectedRoom, deviceInputs)
      } else {
        // Save devices without room assignment
        result = await saveDevices(tenant.id, deviceInputs)
      }

      if (result.success) {
        setDevices([])
        alert(result.message || 'Devices saved successfully!')
      } else {
        alert(result.error || 'Failed to save devices')
      }
    } catch (error) {
      console.error('Error saving devices:', error)
      alert('Failed to save devices. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPower = devices.reduce((sum, device) => sum + parseFloat(device.powerWatts || '0'), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Link href="/tenants" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-center flex-1">{tenant.name}</h1>
          <div className="w-9" /> {/* Spacer for center alignment */}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Room Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Home className="mr-2 h-5 w-5" />
              Select Room (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRooms ? (
              <div className="h-12 bg-gray-200 rounded animate-pulse" />
            ) : rooms.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">No rooms available</p>
                <Link href={`/tenants/${tenant.id}/rooms`}>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Room
                  </Button>
                </Link>
              </div>
            ) : (
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose a room or leave blank for no assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No room assignment</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        {room.room_number}
                        {room.room_type && (
                          <span className="ml-1 text-gray-500">({room.room_type})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Quick Templates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Quick Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredTemplates.map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center p-2 text-sm"
                  onClick={() => {
                    setCurrentDevice({
                      name: template.name,
                      powerWatts: template.powerWatts.toString(),
                      usageHoursPerDay: '8'
                    })
                  }}
                >
                  <span className="text-lg mb-1">{template.icon}</span>
                  <span className="font-medium">{template.name}</span>
                  <span className="text-xs text-gray-500">{template.powerWatts}W</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Input Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Add Device
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                value={currentDevice.name}
                onChange={(e) => setCurrentDevice({ ...currentDevice, name: e.target.value })}
                placeholder="e.g., Living Room TV"
                className="h-12 text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="powerWatts" className="flex items-center">
                  <Zap className="mr-1 h-4 w-4" />
                  Power (Watts)
                </Label>
                <Input
                  id="powerWatts"
                  type="number"
                  value={currentDevice.powerWatts}
                  onChange={(e) => setCurrentDevice({ ...currentDevice, powerWatts: e.target.value })}
                  placeholder="100"
                  className="h-12 text-lg"
                  inputMode="numeric"
                />
              </div>

              <div>
                <Label htmlFor="usageHours" className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Hours/Day
                </Label>
                <Input
                  id="usageHours"
                  type="number"
                  step="0.5"
                  max="24"
                  value={currentDevice.usageHoursPerDay}
                  onChange={(e) => setCurrentDevice({ ...currentDevice, usageHoursPerDay: e.target.value })}
                  placeholder="8"
                  className="h-12 text-lg"
                  inputMode="decimal"
                />
              </div>
            </div>

            <Button
              onClick={addDevice}
              size="lg"
              className="w-full h-12 text-lg"
              disabled={!currentDevice.name || !currentDevice.powerWatts || !currentDevice.usageHoursPerDay}
            >
              Add Device
            </Button>
          </CardContent>
        </Card>

        {/* Added Devices List */}
        {devices.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Added Devices ({devices.length})
              </CardTitle>
              <p className="text-sm text-gray-500">
                Total Power: {totalPower.toLocaleString()}W
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{device.name}</h4>
                    <p className="text-sm text-gray-500">
                      {device.powerWatts}W • {device.usageHoursPerDay}h/day
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDevice(device.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        {devices.length > 0 && (
          <div className="sticky bottom-4 pt-4">
            <Button
              onClick={saveAllDevices}
              size="lg"
              className="w-full h-14 text-lg shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (
                <>
                  Save {devices.length} Device{devices.length > 1 ? 's' : ''}
                  {selectedRoom && selectedRoom !== 'none' && (
                    <span className="ml-1 font-normal">
                      to {rooms.find(r => r.id === selectedRoom)?.room_number || 'Selected Room'}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}