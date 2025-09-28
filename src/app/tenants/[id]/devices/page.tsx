import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import DeviceInputForm from '@/components/device-input-form'

interface DeviceInputPageProps {
  params: Promise<{ id: string }>
}

export default async function DeviceInputPage({ params }: DeviceInputPageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<DeviceInputLoading />}>
      <DeviceInputContent tenantId={id} />
    </Suspense>
  )
}

async function DeviceInputContent({ tenantId }: { tenantId: string }) {
  const supabase = createServerClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error || !tenant) {
    notFound()
  }

  return <DeviceInputForm tenant={tenant} />
}

function DeviceInputLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-6 sticky top-0 z-10">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
      </div>
      <div className="px-4 py-6">
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}