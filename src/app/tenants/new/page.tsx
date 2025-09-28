import { CreateTenantForm } from '@/components/create-tenant-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewTenantPage() {
  return (
    <div className="container mx-auto py-8 max-w-md">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Tenant</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTenantForm />
        </CardContent>
      </Card>
    </div>
  )
}