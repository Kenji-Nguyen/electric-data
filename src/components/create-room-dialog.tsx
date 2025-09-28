'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Home } from 'lucide-react'
import { createRoom, type RoomInput } from '@/actions/room-actions'

interface CreateRoomDialogProps {
  tenantId: string
  variant?: 'default' | 'outline'
}

const roomTypes = [
  { value: 'Standard', label: 'Standard Room', icon: '🏠' },
  { value: 'Deluxe', label: 'Deluxe Room', icon: '⭐' },
  { value: 'Suite', label: 'Suite', icon: '👑' },
  { value: 'Conference Room', label: 'Conference Room', icon: '🏢' },
]

export default function CreateRoomDialog({ tenantId, variant = 'outline' }: CreateRoomDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roomData, setRoomData] = useState<RoomInput>({
    roomNumber: '',
    roomType: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roomData.roomNumber.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createRoom(tenantId, {
        roomNumber: roomData.roomNumber.trim(),
        roomType: roomData.roomType || undefined,
      })

      if (result.success) {
        setRoomData({ roomNumber: '', roomType: '' })
        setOpen(false)
        // TODO: Show success message
      } else {
        // TODO: Show error message
        alert(result.error || 'Failed to create room')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="lg" className="w-full h-14 flex items-center justify-center">
          <Plus className="mr-2 h-5 w-5" />
          Add New Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Home className="mr-2 h-5 w-5" />
            Add New Room
          </DialogTitle>
          <DialogDescription>
            Create a new room to organize your electrical devices.
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
              onClick={() => setOpen(false)}
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
              {isSubmitting ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}