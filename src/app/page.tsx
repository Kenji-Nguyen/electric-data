import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Electric Data</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Manage tenant electrical device consumption with ease
        </p>
        <Button asChild size="lg">
          <Link href="/tenants">
            Get Started
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="text-center">
            <Users className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle>Tenant Management</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Organize and manage multiple tenants with their electrical devices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Zap className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle>Device Tracking</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Track power consumption and usage hours for each electrical device
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle>Energy Analytics</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Calculate daily, monthly, and yearly energy consumption in kWh
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Built with Modern Technologies</h2>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <span>Next.js 15</span>
          <span>•</span>
          <span>App Router</span>
          <span>•</span>
          <span>Server Components</span>
          <span>•</span>
          <span>Server Actions</span>
          <span>•</span>
          <span>Supabase</span>
          <span>•</span>
          <span>shadcn/ui</span>
          <span>•</span>
          <span>Tailwind CSS</span>
        </div>
      </div>
    </div>
  )
}
