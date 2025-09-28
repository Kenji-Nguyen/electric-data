'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createRoom } from '@/actions/room-actions'

interface CreateRoomFormProps {
  tenantId: string
}

export default function CreateRoomForm({ tenantId }: CreateRoomFormProps) {
  const [roomNumber, setRoomNumber] = useState('')
  const [roomType, setRoomType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await createRoom(tenantId, {
        roomNumber: roomNumber.trim(),
        roomType: roomType || undefined
      })

      if (result.success && result.room) {
        // Navigate to devices page for the new room
        router.push(`/tenants/${tenantId}/rooms/${result.room.id}/devices`)
      } else {
        setError(result.error || 'Failed to create room')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      setError('Failed to create room. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const roomTypes = [
    { value: 'Standard', label: 'Standard Room' },
    { value: 'Deluxe', label: 'Deluxe Room' },
    { value: 'Suite', label: 'Suite' },
    { value: 'Conference Room', label: 'Conference Room' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Room Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room Number *</Label>
            <Input
              id="roomNumber"
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g., 101, A-201, Executive Suite"
              required
              disabled={isLoading}
              className="h-12 text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Select value={roomType} onValueChange={setRoomType} disabled={isLoading}>
              <SelectTrigger className="h-12 text-lg">
                <SelectValue placeholder="Select room type (optional)" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-lg"
              disabled={isLoading || !roomNumber.trim()}
            >
              {isLoading ? 'Creating Room...' : 'Create Room & Add Devices'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              After creating the room, you&apos;ll be able to add electrical devices to it.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}