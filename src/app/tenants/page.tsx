import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, ChevronRight, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function TenantsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-center">Select Hotel</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Button asChild size="lg" className="w-full h-14 text-lg">
            <Link href="/tenants/new">
              <Plus className="mr-2 h-5 w-5" />
              Add New Hotel
            </Link>
          </Button>
        </div>

        <Suspense fallback={<TenantsLoading />}>
          <TenantsContent />
        </Suspense>
      </div>
    </div>
  )
}

async function TenantsContent() {
  const supabase = createServerClient()

  const { data: tenantsList, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tenants:', error)
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading tenants</p>
      </div>
    )
  }

  if (!tenantsList || tenantsList.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-500 mb-6 text-lg">No hotels found</p>
        <p className="text-gray-400 text-sm">Add your first hotel to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {tenantsList.map((tenant) => (
        <Link key={tenant.id} href={`/tenants/${tenant.id}`}>
          <Card className="hover:shadow-md transition-all duration-200 active:scale-95 border-2 hover:border-primary/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{tenant.name}</h3>
                  <p className="text-sm text-gray-500">
                    Added {new Date(tenant.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function TenantsLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}