import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CreateRoomForm from '@/components/create-room-form'

interface NewRoomPageProps {
  params: Promise<{ id: string }>
}

export default async function NewRoomPage({ params }: NewRoomPageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<NewRoomLoading />}>
      <NewRoomContent tenantId={id} />
    </Suspense>
  )
}

async function NewRoomContent({ tenantId }: { tenantId: string }) {
  const supabase = createServerClient()

  // Verify tenant exists
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (tenantError || !tenant) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Link href={`/tenants/${tenantId}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-center flex-1">Add New Room</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Room</h2>
          <p className="text-gray-600 mt-1">
            Add a new room to {tenant.name}
          </p>
        </div>

        {/* Create Room Form */}
        <CreateRoomForm tenantId={tenantId} />
      </div>
    </div>
  )
}

function NewRoomLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
      </div>
      <div className="px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mx-auto" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}