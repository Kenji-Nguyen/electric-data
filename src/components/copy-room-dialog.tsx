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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, Home } from 'lucide-react'
import { Room } from '@/lib/supabase'
import { copyRoomDevices } from '@/actions/room-actions'

interface CopyRoomDialogProps {
  sourceRoom: Room
  availableRooms: Room[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CopyRoomDialog({
  sourceRoom,
  availableRooms,
  open,
  onOpenChange
}: CopyRoomDialogProps) {
  const [targetRoomId, setTargetRoomId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter out the source room from available targets
  const targetRooms = availableRooms.filter(room => room.id !== sourceRoom.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!targetRoomId) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await copyRoomDevices(sourceRoom.id, targetRoomId)

      if (result.success) {
        setTargetRoomId('')
        onOpenChange(false)
        // TODO: Show success message/toast
        alert(result.message || 'Device configuration copied successfully!')
      } else {
        alert(result.error || 'Failed to copy room configuration')
      }
    } catch (error) {
      console.error('Error copying room configuration:', error)
      alert('Failed to copy room configuration. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const targetRoom = targetRooms.find(room => room.id === targetRoomId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Copy className="mr-2 h-5 w-5" />
            Copy Room Configuration
          </DialogTitle>
          <DialogDescription>
            Copy all devices from <strong>{sourceRoom.room_number}</strong> to another room.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Room</label>
            <Select
              value={targetRoomId}
              onValueChange={setTargetRoomId}
              disabled={targetRooms.length === 0}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder={
                  targetRooms.length === 0
                    ? "No other rooms available"
                    : "Select room to copy to"
                } />
              </SelectTrigger>
              <SelectContent>
                {targetRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    <div className="flex items-center">
                      <Home className="mr-2 h-4 w-4" />
                      <span>{room.room_number}</span>
                      {room.room_type && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({room.room_type})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {targetRoom && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This will add devices to {targetRoom.room_number}.
                Existing devices in the target room will not be affected.
              </p>
            </div>
          )}

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
              disabled={!targetRoomId || isSubmitting || targetRooms.length === 0}
            >
              {isSubmitting ? 'Copying...' : 'Copy Devices'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}