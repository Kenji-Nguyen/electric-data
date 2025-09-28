# Next.js App Router Architecture Guide

This document explains how we structure and organize Next.js App Router, Server Components, Server Actions, and frontend architecture patterns in this project.

## App Router File-Based Routing System

### Route Definition Patterns

Routes are defined in the `src/app/` directory using Next.js App Router's file-based routing system. Each route directory contains `page.tsx`, `layout.tsx`, `loading.tsx`, and `error.tsx` files.

#### Basic Route Structure

```typescript
// src/app/page.tsx
export default function Home() {
  return <div>Home page content</div>
}
```

#### Server Component with Data Fetching

```typescript
// src/app/users/page.tsx
import { db } from '@/lib/db'
import { users } from '@/schema'

export default async function UsersPage() {
  // Server Component - data fetching happens on the server
  const usersList = await db.select().from(users)

  return (
    <div>
      <h1>Users</h1>
      <UsersList users={usersList} />
    </div>
  )
}
```

#### Layout Components

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Electric Data',
  description: 'Next.js application with Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Naming Conventions

- **Root layout**: `layout.tsx` - Layout for the route segment
- **Page routes**: `page.tsx` - UI for the route
- **Loading UI**: `loading.tsx` - Loading state for the route
- **Error UI**: `error.tsx` - Error state for the route
- **Not Found**: `not-found.tsx` - 404 UI for the route
- **Dynamic routes**: `[id]/page.tsx` - Dynamic parameters (e.g., `/user/123`)
- **Catch-all routes**: `[...slug]/page.tsx` - Catch remaining segments

### Nested Folder Structure Examples

```
src/app/
├── layout.tsx              # Root layout
├── page.tsx                # Home page (/)
├── loading.tsx             # Global loading UI
├── error.tsx               # Global error UI
├── browse/
│   └── page.tsx            # Browse page (/browse)
├── upload/
│   └── page.tsx            # Upload page (/upload)
├── song/
│   └── [id]/               # Dynamic song ID
│       ├── page.tsx        # Song detail (/song/123)
│       ├── loading.tsx     # Loading state for song
│       └── edit/
│           └── page.tsx    # Song edit (/song/123/edit)
├── (auth)/                 # Route group (doesn't affect URL)
│   ├── sign-in/
│   │   └── page.tsx        # Sign in page
│   └── sign-up/
│       └── page.tsx        # Sign up page
└── api/                    # API routes (if needed)
    └── webhook/
        └── route.ts        # API endpoint
```

## Server Components and Data Fetching

### Basic Server Component Pattern

Server Components run on the server and can directly access databases:

```typescript
// src/app/songs/page.tsx
import { db } from '@/lib/db'
import { songs } from '@/schema'
import { desc } from 'drizzle-orm'

export default async function SongsPage() {
  // Direct database access in Server Component
  const recentSongs = await db
    .select()
    .from(songs)
    .orderBy(desc(songs.createdAt))
    .limit(20)

  return (
    <div>
      <h1>Recent Songs</h1>
      <SongsList songs={recentSongs} />
    </div>
  )
}
```

### Server Component with Loading and Error States

```typescript
// src/app/songs/page.tsx
import { Suspense } from 'react'
import { SongsList } from '@/components/songs-list'
import { SongsLoading } from '@/components/songs-loading'

export default function SongsPage() {
  return (
    <div>
      <h1>Songs</h1>
      <Suspense fallback={<SongsLoading />}>
        <SongsContent />
      </Suspense>
    </div>
  )
}

async function SongsContent() {
  const songs = await db.select().from(songsTable)
  return <SongsList songs={songs} />
}
```

### Dynamic Route with Parameters

```typescript
// src/app/song/[id]/page.tsx
import { db } from '@/lib/db'
import { songs } from '@/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

interface Props {
  params: { id: string }
}

export default async function SongPage({ params }: Props) {
  const song = await db
    .select()
    .from(songs)
    .where(eq(songs.id, params.id))
    .then(rows => rows[0])

  if (!song) {
    notFound()
  }

  return (
    <div>
      <h1>{song.title}</h1>
      <p>Artist: {song.artist}</p>
      <SongDetails song={song} />
    </div>
  )
}
```

## Server Actions Architecture

Server Actions handle form submissions and data mutations on the server.

### Basic Server Action Pattern

```typescript
// src/actions/songs.ts
'use server'

import { db } from '@/lib/db'
import { songs } from '@/schema'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSongAction(formData: FormData) {
  // Extract and validate form data
  const title = formData.get('title') as string
  const artist = formData.get('artist') as string

  if (!title || !artist) {
    throw new Error('Title and artist are required')
  }

  // Insert into database
  const [newSong] = await db
    .insert(songs)
    .values({
      title,
      artist,
      createdAt: new Date(),
    })
    .returning()

  // Revalidate affected routes
  revalidatePath('/songs')

  // Redirect to the new song
  redirect(`/song/${newSong.id}`)
}
```

### Server Action with Type-Safe Data

```typescript
// src/actions/songs.ts
'use server'

import { z } from 'zod'

const CreateSongSchema = z.object({
  title: z.string().min(2).max(100),
  artist: z.string().min(1).max(50),
  audioKey: z.string().min(1, 'Audio key is required'),
})

export async function createSongAction(
  prevState: any,
  formData: FormData
) {
  // Validate data
  const validatedFields = CreateSongSchema.safeParse({
    title: formData.get('title'),
    artist: formData.get('artist'),
    audioKey: formData.get('audioKey'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    // Insert song
    const [song] = await db
      .insert(songs)
      .values(validatedFields.data)
      .returning()

    revalidatePath('/songs')
    return { success: true, songId: song.id }
  } catch (error) {
    return {
      errors: { _form: ['Failed to create song'] },
    }
  }
}
```

### Form Component Using Server Actions

```typescript
// src/components/create-song-form.tsx
'use client'

import { useActionState } from 'react'
import { createSongAction } from '@/actions/songs'
import { Button } from '@/components/ui/button'

export function CreateSongForm() {
  const [state, formAction] = useActionState(createSongAction, null)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="border rounded px-3 py-2"
        />
        {state?.errors?.title && (
          <p className="text-red-500">{state.errors.title[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="artist">Artist</label>
        <input
          type="text"
          id="artist"
          name="artist"
          required
          className="border rounded px-3 py-2"
        />
        {state?.errors?.artist && (
          <p className="text-red-500">{state.errors.artist[0]}</p>
        )}
      </div>

      <Button type="submit">Create Song</Button>

      {state?.errors?._form && (
        <p className="text-red-500">{state.errors._form[0]}</p>
      )}
    </form>
  )
}
```

## Frontend Architecture: Components and Client State

The frontend is organized into clear layers with separation of concerns:

### 1. Server Components (`src/app/`)

Handle data fetching and initial rendering:

```typescript
// src/app/songs/page.tsx - Server Component
export default async function SongsPage() {
  const songs = await db.select().from(songsTable)

  return (
    <div>
      <h1>Songs</h1>
      <SongsList songs={songs} />
      <CreateSongForm />
    </div>
  )
}
```

### 2. Client Components (`src/components/`)

Handle interactivity and client-side state:

```typescript
// src/components/songs-list.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  songs: Song[]
}

export function SongsList({ songs }: Props) {
  const [filter, setFilter] = useState('')

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <input
        type="text"
        placeholder="Filter songs..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="border rounded px-3 py-2 mb-4"
      />

      <div className="grid gap-4">
        {filteredSongs.map(song => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  )
}
```

### 3. Server Actions (`src/actions/`)

Handle data mutations and form submissions:

```typescript
// src/actions/songs.ts - Server Actions
'use server'

export async function deleteSongAction(songId: string) {
  await db.delete(songs).where(eq(songs.id, songId))
  revalidatePath('/songs')
}

export async function updateSongAction(
  songId: string,
  formData: FormData
) {
  const title = formData.get('title') as string

  await db
    .update(songs)
    .set({ title, updatedAt: new Date() })
    .where(eq(songs.id, songId))

  revalidatePath('/songs')
  revalidatePath(`/song/${songId}`)
}
```

## Architecture Benefits

### Server-First Performance
- **Server Components**: Fast initial page loads with server-rendered content
- **Streaming**: Progressive loading with Suspense boundaries
- **Caching**: Automatic caching and revalidation strategies

### Type Safety
- **Database Types**: Generated from Drizzle schema
- **Server Actions**: Type-safe form handling
- **End-to-end**: TypeScript throughout the entire stack

### Developer Experience
- **File-based Routing**: Intuitive route organization
- **Server Actions**: Simplified form handling without API routes
- **Error Boundaries**: Automatic error handling and recovery

### SEO and Performance
- **SSR by Default**: Server-rendered content for better SEO
- **Optimistic Updates**: Fast UI feedback with revalidation
- **Progressive Enhancement**: Works without JavaScript

## Migration from TanStack Start

### Route Conversion
```typescript
// TanStack Start (old)
export const Route = createFileRoute("/song/$id/")({
  loader: ({ params: { id } }) => getSong(id),
  component: SongDetail,
})

// Next.js App Router (new)
export default async function SongPage({ params }: { params: { id: string } }) {
  const song = await getSong(params.id)
  return <SongDetail song={song} />
}
```

### Server Function → Server Action
```typescript
// TanStack Start (old)
export const createSongFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  return await createSong(data)
})

// Next.js Server Action (new)
export async function createSongAction(formData: FormData) {
  'use server'
  const data = Object.fromEntries(formData)
  return await createSong(data)
}
```

This architecture provides a scalable, type-safe, and maintainable foundation for Next.js applications with excellent performance characteristics and developer experience.