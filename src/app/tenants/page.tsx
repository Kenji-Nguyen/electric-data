import { Suspense } from 'react'
import { db } from '@/lib/db'
import { tenants } from '@/schema'
import { desc } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function TenantsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tenants</h1>
        <Button asChild>
          <Link href="/tenants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Link>
        </Button>
      </div>

      <Suspense fallback={<TenantsLoading />}>
        <TenantsContent />
      </Suspense>
    </div>
  )
}

async function TenantsContent() {
  const tenantsList = await db
    .select()
    .from(tenants)
    .orderBy(desc(tenants.createdAt))

  if (tenantsList.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No tenants found</p>
          <Button asChild>
            <Link href="/tenants/new">Create your first tenant</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tenantsList.map((tenant) => (
        <Card key={tenant.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>
              <Link
                href={`/tenant/${tenant.id}`}
                className="hover:text-primary transition-colors"
              >
                {tenant.name}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Created: {new Date(tenant.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TenantsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}