# Electric Data - Hotel Device Management System

A modern Next.js 15 application for managing electrical devices in hotels, built with App Router, Server Components, and Supabase.

## Project Overview

This application enables hotel management to track electrical devices and their power consumption across multiple properties. It features a mobile-first design with quick device templates and batch input capabilities.

### Key Features

- **Multi-tenant Management**: Separate hotels/properties with isolated device data
- **Visual Dashboard**: Comprehensive overview with room grid and health indicators
- **Room-Centric Design**: Individual room management with device organization
- **Power Analytics**: Real-time consumption tracking and cost estimation
- **Mobile-First UI**: Optimized for on-the-go device input with large touch targets
- **Device Templates**: Quick access to common electrical devices with preset power ratings
- **Health Monitoring**: Visual indicators for room power consumption efficiency
- **Batch Input**: Add multiple devices efficiently with real-time power calculation
- **TypeScript Safety**: Full type safety with Supabase-generated types

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript 5
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Charts**: shadcn/ui charts (built on Recharts)
- **Development**: Turbopack for fast builds
- **Validation**: Zod for server-side validation

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server with Turbopack
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start

# Run linting
pnpm run lint

# Database operations (once configured)
# Apply SQL schema to Supabase manually or via CLI
```

## Environment Setup

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   ├── tenants/           # Tenant management routes
│   │   ├── page.tsx      # Tenant selection page
│   │   └── [id]/         # Dynamic tenant routes
│   │       ├── page.tsx  # Tenant dashboard (main view)
│   │       ├── report/   # Power consumption reports
│   │       └── rooms/    # Room management
│   │           ├── page.tsx          # Rooms overview (legacy)
│   │           ├── new/page.tsx      # Create new room
│   │           └── [roomId]/         # Individual room routes
│   │               ├── page.tsx      # Room details & device overview
│   │               └── devices/      # Device management for room
├── components/
│   ├── ui/                # shadcn/ui components (including chart)
│   ├── dashboard-stats.tsx           # Overview metrics cards
│   ├── dashboard-room-grid.tsx       # Visual room grid with health indicators
│   ├── create-room-form.tsx          # New room creation form
│   └── [features]/        # Other feature-specific components
├── lib/
│   ├── supabase.ts        # Supabase client setup and types
│   └── utils.ts           # Utility functions
├── actions/               # Server Actions for device and room operations
│   ├── room-actions.ts    # Room CRUD + getTenantDashboard
│   └── device-actions.ts  # Device CRUD operations
├── types/                 # TypeScript type definitions
```

## Architecture Principles

### Server-First Architecture
- **Server Components**: Default for data fetching and rendering
- **Server Actions**: Handle form submissions and mutations
- **Client Components**: Only when interactivity is needed

### Database Layer
- **Supabase**: PostgreSQL database with built-in authentication and real-time features
- **Type Safety**: Generated TypeScript types from database schema
- **Server Actions**: Secure server-side database operations

### Styling Approach
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built, customizable components
- **CSS Variables**: Theme configuration and customization
- **Mobile-First**: Responsive design optimized for mobile devices

## Database Schema

### Tables

#### `tenants`
Stores hotel/property information:
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

#### `electrical_devices`
Stores electrical device data for each tenant:
```sql
CREATE TABLE electrical_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_name VARCHAR(255) NOT NULL,
  power_watts DECIMAL(10, 2) NOT NULL,
  usage_hours_per_day DECIMAL(4, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### Database Setup

1. Copy the SQL schema from `supabase-schema.sql`
2. Run in Supabase SQL Editor or via CLI
3. Enable Row Level Security (RLS) for production use

## Application Flow

### User Journey

1. **Select Hotel** (`/tenants`)
   - View list of existing hotels/tenants
   - Large, touch-friendly cards with hotel icons
   - Option to add new hotel

2. **Hotel Dashboard** (`/tenants/[id]`)
   - **Overview Stats**: Total rooms, devices, daily kWh consumption, monthly cost estimate
   - **Room Grid**: Visual grid showing all rooms with health indicators (green/yellow/red)
   - **Quick Actions**: Add new room, view detailed power report
   - **Room Details**: Click any room card to navigate to room management

3. **Room Management** (`/tenants/[id]/rooms/[roomId]`)
   - **Room Overview**: Room details, power consumption stats, health status
   - **Device List**: All devices in the room with individual consumption metrics
   - **Device Management**: Add, edit, or remove devices for the specific room

4. **Add New Room** (`/tenants/[id]/rooms/new`)
   - **Room Creation**: Add room number and type
   - **Direct Flow**: After creating room, automatically navigate to device addition

5. **Device Management** (`/tenants/[id]/rooms/[roomId]/devices`)
   - Quick templates with common devices (LED bulbs, AC units, etc.)
   - Category-based filtering (Lighting, HVAC, Kitchen, Electronics)
   - Manual device input with power and usage validation
   - Real-time power consumption totals
   - Batch saving with optimistic updates

### Mobile-First Design Features

- **Large Touch Targets**: Minimum 44px for all interactive elements
- **Sticky Headers**: Important context always visible
- **Category Filters**: Horizontal scrolling chips for template categories
- **Numeric Inputs**: Optimized keyboards for power/hours entry
- **Visual Feedback**: Active states and loading indicators
- **Progressive Enhancement**: Works without JavaScript
- **Visual Health Indicators**: Color-coded room status (green=efficient, yellow=moderate, red=high usage)
- **Grid Layout**: 2-column room grid optimized for mobile viewing
- **Touch-Friendly Cards**: Large, tappable room cards with clear visual hierarchy

### Device Templates

Predefined templates with power ratings:
- **Lighting**: LED Bulb (10W), Fluorescent (40W)
- **HVAC**: Ceiling Fan (75W), Air Conditioner (2000W)
- **Kitchen**: Refrigerator (150W), Microwave (1000W), Coffee Maker (800W)
- **Electronics**: Television (100W), Computer (300W)

## Code Conventions

### File Naming
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Server Actions**: camelCase with Action suffix (e.g., `createUserAction.ts`)
- **Types**: PascalCase interfaces/types (e.g., `UserData`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)

### Import Organization
```typescript
// 1. React/Next.js imports
import { Suspense } from 'react'
import { redirect } from 'next/navigation'

// 2. Third-party libraries
// (third-party imports go here)

// 3. Internal imports (absolute paths)
import { createServerClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

// 4. Relative imports
import './styles.css'
```

### Server Component Patterns
```typescript
// Async Server Component
export default async function UsersPage() {
  const users = await db.select().from(usersTable)

  return (
    <div>
      <h1>Users</h1>
      <UsersList users={users} />
    </div>
  )
}

// With error boundaries and loading
export default async function UsersPage() {
  return (
    <Suspense fallback={<UsersSkeleton />}>
      <UsersContent />
    </Suspense>
  )
}
```

### Server Action Patterns
```typescript
'use server'

import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Input validation schema
const DeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required'),
  powerWatts: z.number().positive('Power must be positive'),
  usageHoursPerDay: z.number().min(0).max(24, 'Usage hours must be between 0 and 24'),
})

export async function saveDevices(tenantId: string, devices: DeviceInput[]) {
  try {
    // Validate input
    const validatedDevices = z.array(DeviceSchema).parse(devices)

    if (validatedDevices.length === 0) {
      return { success: false, error: 'No devices to save' }
    }

    const supabase = createServerClient()

    // Database operation
    const { error } = await supabase
      .from('electrical_devices')
      .insert(validatedDevices.map(device => ({
        tenant_id: tenantId,
        device_name: device.name,
        power_watts: device.powerWatts,
        usage_hours_per_day: device.usageHoursPerDay,
      })))

    if (error) {
      return { success: false, error: 'Failed to save devices to database' }
    }

    // Revalidation
    revalidatePath(`/tenants/${tenantId}/devices`)

    return { success: true, message: `Successfully saved ${validatedDevices.length} device(s)` }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid device data provided' }
    }
    return { success: false, error: 'Failed to save devices. Please try again.' }
  }
}
```

## Development Workflow

1. **Feature Development**:
   - Design database schema in Supabase SQL Editor
   - Update TypeScript types in `/src/lib/supabase.ts`
   - Build Server Components for UI
   - Add Server Actions for mutations
   - Add shadcn/ui components as needed

2. **Database Changes**:
   - Update SQL schema in Supabase
   - Update TypeScript types in `/src/lib/supabase.ts`
   - Test with `createServerClient()` in Server Actions

3. **Component Development**:
   - Start with Server Components
   - Add "use client" only when needed
   - Use shadcn/ui for consistent design
   - Implement proper loading and error states

## Best Practices

### Performance
- Prefer Server Components over Client Components
- Use Suspense boundaries for progressive loading
- Implement proper caching with `revalidatePath`
- Optimize images with Next.js Image component

### Type Safety
- Define database schema in Supabase
- Use TypeScript strict mode
- Create shared types in `/src/types/`
- Validate form data in Server Actions

### Security
- Validate all inputs in Server Actions
- Use Supabase Row Level Security (RLS)
- Sanitize user inputs
- Implement proper error handling

### Accessibility
- Use semantic HTML elements
- Implement proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers

## Deployment

This project is optimized for deployment on Vercel:

1. Connect your GitHub repository
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

For other platforms, ensure Node.js 18+ support and proper environment variable configuration.

## Testing

```bash
# Unit tests (when configured)
pnpm run test

# Type checking
npx tsc --noEmit

# Linting
pnpm run lint
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Verify environment variables and network access
2. **Type Errors**: Update TypeScript types in supabase.ts after schema changes
3. **Build Errors**: Check for Client Component boundaries
4. **Styling Issues**: Verify Tailwind CSS configuration

### Debug Commands
```bash
# Check environment variables
pnpm run dev -- --inspect

# Verbose build output
pnpm run build -- --debug

# Database connection test
npx tsx scripts/test-db.ts
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)