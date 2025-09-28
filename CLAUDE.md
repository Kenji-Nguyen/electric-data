# Electric Data - Next.js Project

A modern Next.js 15 application built with App Router, Server Components, Supabase, and Drizzle ORM.

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript 5
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM 0.44.5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Development**: Turbopack for fast builds

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Database operations (once configured)
npx drizzle-kit generate    # Generate migrations
npx drizzle-kit migrate     # Run migrations
npx drizzle-kit studio      # Open Drizzle Studio
```

## Environment Setup

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database URL for Drizzle
DATABASE_URL=postgresql://user:password@host:port/database

# Optional: Direct connection for migrations
DIRECT_URL=postgresql://user:password@host:port/database
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── [routes]/          # File-based routing
├── components/
│   ├── ui/                # shadcn/ui components
│   └── [features]/        # Feature-specific components
├── lib/
│   ├── db.ts              # Drizzle ORM configuration
│   ├── supabase.ts        # Supabase client setup
│   └── utils.ts           # Utility functions
├── actions/               # Server Actions
├── types/                 # TypeScript type definitions
└── schema/               # Database schema (Drizzle)
```

## Architecture Principles

### Server-First Architecture
- **Server Components**: Default for data fetching and rendering
- **Server Actions**: Handle form submissions and mutations
- **Client Components**: Only when interactivity is needed

### Database Layer
- **Drizzle ORM**: Type-safe database operations
- **Supabase**: PostgreSQL database and real-time features
- **Schema-driven**: Database schema defines TypeScript types

### Styling Approach
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built, customizable components
- **CSS Variables**: Theme configuration and customization

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
import { sql } from 'drizzle-orm'

// 3. Internal imports (absolute paths)
import { db } from '@/lib/db'
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

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createUserAction(formData: FormData) {
  // Validation
  const name = formData.get('name') as string
  if (!name) throw new Error('Name is required')

  // Database operation
  const [user] = await db.insert(usersTable).values({ name }).returning()

  // Revalidation and redirect
  revalidatePath('/users')
  redirect(`/users/${user.id}`)
}
```

## Development Workflow

1. **Feature Development**:
   - Create schema in `/src/schema/`
   - Generate and run migrations
   - Build Server Components for UI
   - Add Server Actions for mutations
   - Add shadcn/ui components as needed

2. **Database Changes**:
   - Update schema files
   - Generate migrations: `npx drizzle-kit generate`
   - Run migrations: `npx drizzle-kit migrate`
   - Update TypeScript types

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
- Define database schema with Drizzle
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
npm run test

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Verify environment variables and network access
2. **Type Errors**: Regenerate Drizzle types after schema changes
3. **Build Errors**: Check for Client Component boundaries
4. **Styling Issues**: Verify Tailwind CSS configuration

### Debug Commands
```bash
# Check environment variables
npm run dev -- --inspect

# Verbose build output
npm run build -- --debug

# Database connection test
npx tsx scripts/test-db.ts
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)