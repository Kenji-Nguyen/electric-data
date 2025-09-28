'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Zap, Users, MoreVertical, Copy, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Room } from '@/lib/supabase'
import CopyRoomDialog from '@/components/copy-room-dialog'
import EditRoomDialog from '@/components/edit-room-dialog'
import { deleteRoom } from '@/actions/room-actions'

interface RoomCardProps {
  room: Room & {
    electrical_devices?: { count: number }[]
  }
  tenantId: string
  allRooms?: Room[]
}

const getRoomTypeColor = (roomType: string | null) => {
  switch (roomType?.toLowerCase()) {
    case 'standard':
      return 'bg-blue-100 text-blue-800'
    case 'deluxe':
      return 'bg-purple-100 text-purple-800'
    case 'suite':
      return 'bg-gold-100 text-gold-800 bg-yellow-100 text-yellow-800'
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

export default function RoomCard({ room, tenantId, allRooms = [] }: RoomCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deviceCount = room.electrical_devices?.[0]?.count || 0

  const handleCopyRoom = () => {
    setShowActions(false)
    setShowCopyDialog(true)
  }

  const handleEditRoom = () => {
    setShowActions(false)
    setShowEditDialog(true)
  }

  const handleDeleteRoom = async () => {
    if (!confirm(`Are you sure you want to delete room "${room.room_number}"? This will also delete all devices in this room.`)) {
      return
    }

    setIsDeleting(true)
    setShowActions(false)

    try {
      const result = await deleteRoom(room.id)

      if (result.success) {
        // Room deletion will trigger a page revalidation
      } else {
        alert(result.error || 'Failed to delete room')
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('Failed to delete room. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
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

          <DropdownMenu open={showActions} onOpenChange={setShowActions}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEditRoom}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Room
              </DropdownMenuItem>
              {deviceCount > 0 && (
                <DropdownMenuItem onClick={handleCopyRoom}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Configuration
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteRoom}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Room
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Room Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Zap className="mr-1 h-4 w-4" />
            <span>{deviceCount} device{deviceCount !== 1 ? 's' : ''}</span>
          </div>
          {/* TODO: Add power consumption when we have the calculation */}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2">
          <Link href={`/tenants/${tenantId}/rooms/${room.id}/devices`}>
            <Button
              size="lg"
              className="w-full h-12 text-base"
              variant={deviceCount > 0 ? "default" : "default"}
            >
              {deviceCount > 0 ? (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Manage Devices
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Add Devices
                </>
              )}
            </Button>
          </Link>
        </div>
      </CardContent>

      {/* Dialogs */}
      <EditRoomDialog
        room={room}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <CopyRoomDialog
        sourceRoom={room}
        availableRooms={allRooms}
        open={showCopyDialog}
        onOpenChange={setShowCopyDialog}
      />
    </Card>
  )
}