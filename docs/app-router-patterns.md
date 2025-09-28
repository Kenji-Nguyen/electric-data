# App Router Layered Architecture Guide

This document explains the layered architecture pattern adapted for Next.js App Router. Each layer has a specific responsibility and depends only on the layers below it, creating a clean separation of concerns and maintainable codebase.

## Architecture Overview

The application follows a strict layered architecture with the following flow:

```
App Routes → Components → Server Actions → Database Layer
```

Each layer builds upon the previous one, creating a clear dependency chain and separation of concerns.

## Layer Definitions

### 1. App Routes Layer (`src/app/`)

**Purpose**: Handles URL routing, parameters, and page-level data loading using Server Components.

**Responsibilities**:
- Define route structure and parameters using file-based routing
- Handle data fetching with async Server Components
- Compose page components and layouts
- Manage loading and error states

**Example**: `src/app/song/[id]/page.tsx`
```typescript
import { db } from '@/lib/db'
import { songs } from '@/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { SongDetail } from '@/components/song-detail'

interface Props {
  params: { id: string }
}

export default async function SongPage({ params }: Props) {
  // Direct data fetching in Server Component
  const song = await db
    .select()
    .from(songs)
    .where(eq(songs.id, params.id))
    .then(rows => rows[0])

  if (!song) {
    notFound()
  }

  return <SongDetail song={song} />
}
```

### 2. Components Layer (`src/components/`)

**Purpose**: Reusable UI components that handle presentation and user interactions.

**Responsibilities**:
- Render UI elements using shadcn/ui components
- Handle user interactions and client-side state
- Manage local component state
- Compose smaller components into larger ones

**Example**: `src/components/song-card.tsx`
```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { deleteSongAction } from '@/actions/songs'
import type { Song } from '@/schema'

interface Props {
  song: Song
}

export function SongCard({ song }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{song.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{song.artist}</p>
        <form action={deleteSongAction.bind(null, song.id)}>
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### 3. Server Actions Layer (`src/actions/`)

**Purpose**: Handle form submissions, data mutations, and business logic on the server.

**Responsibilities**:
- Process form data and validate inputs
- Execute database operations
- Handle authentication and authorization
- Manage cache invalidation and redirects

**Example**: `src/actions/songs.ts`
```typescript
'use server'

import { db } from '@/lib/db'
import { songs } from '@/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const CreateSongSchema = z.object({
  title: z.string().min(2).max(100),
  artist: z.string().min(1).max(50),
})

export async function createSongAction(formData: FormData) {
  // Validation layer
  const validatedFields = CreateSongSchema.safeParse({
    title: formData.get('title'),
    artist: formData.get('artist'),
  })

  if (!validatedFields.success) {
    throw new Error('Invalid form data')
  }

  // Business logic layer
  const [song] = await db
    .insert(songs)
    .values(validatedFields.data)
    .returning()

  // Cache management
  revalidatePath('/songs')
  redirect(`/song/${song.id}`)
}

export async function deleteSongAction(songId: string) {
  await db.delete(songs).where(eq(songs.id, songId))
  revalidatePath('/songs')
}
```

### 4. Database Layer (`src/lib/db.ts`, `src/schema/`)

**Purpose**: Handle database connections, schema definitions, and data access patterns.

**Responsibilities**:
- Define database schema with Drizzle ORM
- Manage database connections
- Provide type-safe database operations
- Handle connection pooling and optimization

**Example**: `src/schema/songs.ts`
```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const songs = pgTable('songs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  artist: varchar('artist', { length: 255 }).notNull(),
  audioUrl: varchar('audio_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Song = typeof songs.$inferSelect
export type NewSong = typeof songs.$inferInsert
```

## Dependency Rules

### Strict Layer Dependencies

1. **App Routes** can depend on:
   - Components (for UI rendering)
   - Database Layer (for direct data fetching)
   - Never import Server Actions directly

2. **Components** can depend on:
   - Other Components (composition)
   - Server Actions (for form actions)
   - UI Components (shadcn/ui)
   - Never access Database Layer directly

3. **Server Actions** can depend on:
   - Database Layer (for data operations)
   - External services and APIs
   - Never import Components

4. **Database Layer** can depend on:
   - External database systems
   - No other application layers

### Example of Proper Dependencies

```typescript
// ✅ CORRECT: App Route using Database Layer
// src/app/songs/page.tsx
import { db } from '@/lib/db' // Database Layer
import { SongsList } from '@/components/songs-list' // Component Layer

export default async function SongsPage() {
  const songs = await db.select().from(songsTable) // Direct DB access in Server Component
  return <SongsList songs={songs} />
}

// ✅ CORRECT: Component using Server Action
// src/components/create-song-form.tsx
import { createSongAction } from '@/actions/songs' // Server Action

export function CreateSongForm() {
  return (
    <form action={createSongAction}>
      {/* Form fields */}
    </form>
  )
}

// ✅ CORRECT: Server Action using Database Layer
// src/actions/songs.ts
import { db } from '@/lib/db' // Database Layer

export async function createSongAction(formData: FormData) {
  await db.insert(songs).values(data)
}
```

### Anti-Patterns to Avoid

```typescript
// ❌ WRONG: Component accessing Database directly
// src/components/songs-list.tsx
import { db } from '@/lib/db' // Never do this!

export function SongsList() {
  // Components should never access the database directly
  const songs = await db.select().from(songsTable) // ❌
}

// ❌ WRONG: Server Action importing Components
// src/actions/songs.ts
import { SongCard } from '@/components/song-card' // Never do this!

// ❌ WRONG: Database Layer depending on Application Logic
// src/lib/db.ts
import { validateSong } from '@/actions/songs' // Never do this!
```

## Component Patterns

### Server Component Pattern

```typescript
// Server Components handle data fetching
export default async function UsersPage() {
  const users = await db.select().from(usersTable)

  return (
    <div>
      <h1>Users</h1>
      <UsersList users={users} />
    </div>
  )
}
```

### Client Component Pattern

```typescript
'use client'

// Client Components handle interactivity
export function UsersList({ users }: { users: User[] }) {
  const [filter, setFilter] = useState('')

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter users..."
      />
      {/* Render filtered users */}
    </div>
  )
}
```

### Form Component with Server Action

```typescript
'use client'

export function CreateUserForm() {
  const [state, formAction] = useActionState(createUserAction, null)

  return (
    <form action={formAction}>
      <input name="name" required />
      <button type="submit">Create User</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  )
}
```

## Benefits of This Architecture

### Clear Separation of Concerns

1. **Server Components**: Data fetching and initial rendering
2. **Client Components**: User interactions and client-side state
3. **Server Actions**: Business logic and data mutations
4. **Database Layer**: Data persistence and schema

### Type Safety Throughout

- Server Components get properly typed data from database
- Server Actions use Zod or similar for validation
- Components receive typed props
- Database operations are type-safe with Drizzle

### Performance Optimizations

- Server Components reduce client-side JavaScript
- Database queries happen close to the data
- Automatic caching and revalidation
- Streaming and progressive enhancement

### Testability

Each layer can be tested independently:
- Server Components can be tested with mock data
- Client Components can be tested with React Testing Library
- Server Actions can be unit tested
- Database layer can be tested with test databases

### Scalability

- Clear boundaries make the codebase easier to navigate
- New features follow established patterns
- Refactoring is safer with defined dependencies
- Team members can work on different layers independently

## Migration Guidelines

### From TanStack Start to Next.js App Router

1. **Routes**: Convert file-based routes to App Router structure
2. **Loaders**: Replace with async Server Components
3. **Server Functions**: Convert to Server Actions
4. **Client State**: Use React state and hooks in Client Components

### Code Organization

```
src/
├── app/                    # App Router (replaces routes/)
├── components/             # UI Components (same concept)
├── actions/               # Server Actions (replaces fn/)
├── lib/                   # Utilities and configurations
└── schema/                # Database schema (replaces data access layer)
```

This layered architecture ensures maintainable, scalable, and performant Next.js applications while leveraging the full power of App Router and Server Components.