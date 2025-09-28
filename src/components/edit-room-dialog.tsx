'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit, Home } from 'lucide-react'
import { Room } from '@/lib/supabase'
import { updateRoom, type RoomInput } from '@/actions/room-actions'

interface EditRoomDialogProps {
  room: Room
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roomTypes = [
  { value: 'Standard', label: 'Standard Room', icon: '🏠' },
  { value: 'Deluxe', label: 'Deluxe Room', icon: '⭐' },
  { value: 'Suite', label: 'Suite', icon: '👑' },
  { value: 'Conference Room', label: 'Conference Room', icon: '🏢' },
]

export default function EditRoomDialog({ room, open, onOpenChange }: EditRoomDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roomData, setRoomData] = useState<RoomInput>({
    roomNumber: room.room_number,
    roomType: room.room_type || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roomData.roomNumber.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateRoom(room.id, {
        roomNumber: roomData.roomNumber.trim(),
        roomType: roomData.roomType || undefined,
      })

      if (result.success) {
        onOpenChange(false)
        // TODO: Show success message/toast
      } else {
        alert(result.error || 'Failed to update room')
      }
    } catch (error) {
      console.error('Error updating room:', error)
      alert('Failed to update room. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="mr-2 h-5 w-5" />
            Edit Room
          </DialogTitle>
          <DialogDescription>
            Update the room number and type.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room Number/Name *</Label>
            <Input
              id="roomNumber"
              value={roomData.roomNumber}
              onChange={(e) => setRoomData({ ...roomData, roomNumber: e.target.value })}
              placeholder="e.g., 101, Presidential Suite"
              className="h-12 text-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Select
              value={roomData.roomType}
              onValueChange={(value) => setRoomData({ ...roomData, roomType: value })}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select room type (optional)" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center">
                      <span className="mr-2">{type.icon}</span>
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!roomData.roomNumber.trim() || isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}