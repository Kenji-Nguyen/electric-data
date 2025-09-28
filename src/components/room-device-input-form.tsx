'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Zap, Clock, Package, ArrowRight, Edit, MoreVertical } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { Tenant, Room, ElectricalDevice } from '@/lib/supabase'
import { saveDevicesToRoom, updateDevice, deleteDevice, type DeviceInput } from '@/actions/device-actions'
import { getNextRoom } from '@/actions/room-actions'
import { useRouter } from 'next/navigation'

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

interface RoomDeviceInputFormProps {
  tenant: Tenant
  room: Room
  existingDevices: ElectricalDevice[]
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

export default function RoomDeviceInputForm({ tenant, room, existingDevices }: RoomDeviceInputFormProps) {
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [currentDevice, setCurrentDevice] = useState({
    name: '',
    powerWatts: '',
    usageHoursPerDay: ''
  })
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingDevice, setEditingDevice] = useState<ElectricalDevice | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    powerWatts: '',
    usageHoursPerDay: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

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

  const saveDevices = async () => {
    if (devices.length === 0) return false

    setIsSubmitting(true)

    try {
      const deviceInputs: DeviceInput[] = devices.map(device => ({
        name: device.name,
        powerWatts: parseFloat(device.powerWatts),
        usageHoursPerDay: parseFloat(device.usageHoursPerDay)
      }))

      const result = await saveDevicesToRoom(tenant.id, room.id, deviceInputs)

      if (result.success) {
        setDevices([])
        return true
      } else {
        alert(result.error || 'Failed to save devices')
        return false
      }
    } catch (error) {
      console.error('Error saving devices:', error)
      alert('Failed to save devices. Please try again.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveAndNextRoom = async () => {
    const saved = await saveDevices()
    if (!saved) return

    setIsNavigating(true)

    try {
      const result = await getNextRoom(room.id, tenant.id)

      if (result.success && result.nextRoom) {
        router.push(`/tenants/${tenant.id}/rooms/${result.nextRoom.id}/devices`)
      } else if (result.success && result.isLastRoom) {
        // Last room - go back to tenant dashboard
        router.push(`/tenants/${tenant.id}`)
      } else {
        alert(result.error || 'Failed to navigate to next room')
      }
    } catch (error) {
      console.error('Error navigating to next room:', error)
      alert('Failed to navigate to next room')
    } finally {
      setIsNavigating(false)
    }
  }

  const saveAndReturn = async () => {
    const saved = await saveDevices()
    if (saved) {
      router.push(`/tenants/${tenant.id}`)
    }
  }

  const totalPower = devices.reduce((sum, device) => sum + parseFloat(device.powerWatts || '0'), 0)
  const existingPower = existingDevices.reduce((sum, device) => sum + device.power_watts, 0)

  const handleEditDevice = (device: ElectricalDevice) => {
    setEditingDevice(device)
    setEditForm({
      name: device.device_name,
      powerWatts: device.power_watts.toString(),
      usageHoursPerDay: device.usage_hours_per_day.toString()
    })
  }

  const saveEdit = async () => {
    if (!editingDevice) return

    setIsEditing(true)
    try {
      const result = await updateDevice(editingDevice.id, {
        name: editForm.name,
        powerWatts: parseFloat(editForm.powerWatts),
        usageHoursPerDay: parseFloat(editForm.usageHoursPerDay)
      })

      if (result.success) {
        setEditingDevice(null)
        // Refresh the page to show updated data
        router.refresh()
      } else {
        alert(result.error || 'Failed to update device')
      }
    } catch (error) {
      console.error('Error updating device:', error)
      alert('Failed to update device')
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) {
      return
    }

    setIsDeleting(deviceId)
    try {
      const result = await deleteDevice(deviceId)

      if (result.success) {
        // Refresh the page to show updated data
        router.refresh()
      } else {
        alert(result.error || 'Failed to delete device')
      }
    } catch (error) {
      console.error('Error deleting device:', error)
      alert('Failed to delete device')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href={`/tenants/${tenant.id}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold">{room.room_number}</h1>
            {room.room_type && (
              <Badge
                variant="secondary"
                className={`mt-1 ${getRoomTypeColor(room.room_type)}`}
              >
                {room.room_type}
              </Badge>
            )}
          </div>
          <div className="w-9" /> {/* Spacer for center alignment */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Current Devices - Show detailed list with edit/delete */}
        {existingDevices.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Current Devices ({existingDevices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{device.device_name}</h4>
                      <p className="text-sm text-gray-600">
                        {device.power_watts}W • {device.usage_hours_per_day}h/day
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm">
                        <div className="font-medium">{((device.power_watts * device.usage_hours_per_day) / 1000).toFixed(1)} kWh/day</div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting === device.id}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditDevice(device)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteDevice(device.id)}
                            className="text-red-600 focus:text-red-600"
                            disabled={isDeleting === device.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting === device.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    Total Power: <span className="font-medium">{existingPower.toLocaleString()}W</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                New Devices ({devices.length})
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

        {/* Save Buttons */}
        {devices.length > 0 && (
          <div className="space-y-3 pt-4">
            <Button
              onClick={saveAndNextRoom}
              size="lg"
              className="w-full h-14 text-lg shadow-lg"
              disabled={isSubmitting || isNavigating}
            >
              {isNavigating ? (
                'Navigating...'
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Save & Next Room
                </>
              )}
            </Button>

            <Button
              onClick={saveAndReturn}
              variant="outline"
              size="lg"
              className="w-full h-12 text-lg"
              disabled={isSubmitting || isNavigating}
            >
              {isSubmitting ? 'Saving...' : 'Save & Return to Rooms'}
            </Button>
          </div>
        )}

        {/* Edit Device Modal */}
        <Dialog open={!!editingDevice} onOpenChange={(open) => !open && setEditingDevice(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Device</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="editDeviceName">Device Name</Label>
                <Input
                  id="editDeviceName"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g., Living Room TV"
                  className="h-12 text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editPowerWatts" className="flex items-center">
                    <Zap className="mr-1 h-4 w-4" />
                    Power (Watts)
                  </Label>
                  <Input
                    id="editPowerWatts"
                    type="number"
                    value={editForm.powerWatts}
                    onChange={(e) => setEditForm({ ...editForm, powerWatts: e.target.value })}
                    placeholder="100"
                    className="h-12 text-lg"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <Label htmlFor="editUsageHours" className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    Hours/Day
                  </Label>
                  <Input
                    id="editUsageHours"
                    type="number"
                    step="0.5"
                    max="24"
                    value={editForm.usageHoursPerDay}
                    onChange={(e) => setEditForm({ ...editForm, usageHoursPerDay: e.target.value })}
                    placeholder="8"
                    className="h-12 text-lg"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingDevice(null)}
                  disabled={isEditing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={saveEdit}
                  disabled={isEditing || !editForm.name || !editForm.powerWatts || !editForm.usageHoursPerDay}
                >
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}