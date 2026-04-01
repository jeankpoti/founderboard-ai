---
project_name: 'FounderBoard AI'
user_name: 'Yo jk'
date: '2026-02-25'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 45
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing FounderBoard AI. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Critical Notes |
|------------|---------|----------------|
| Next.js | 15.x | App Router ONLY, no pages/ directory |
| React | 19 | Use new hooks (useActionState, not useFormState) |
| TypeScript | strict mode | No `any`, no implicit returns |
| Firebase JS SDK | 12.9.0 | Use modular imports only |
| Firebase Admin | 13.6.1 | Server-side only, never in client |
| Vercel AI SDK | 6.x | Use streamText, not deprecated APIs |
| Zustand | latest | No Redux, no Context for global state |
| Tailwind CSS | latest | Use cn() helper for conditional classes |
| shadcn/ui | latest | Copy components, don't npm install |
| Upstash Redis | latest | REST API only (serverless) |

---

## Critical Implementation Rules

### Firebase/Firestore Rules

**MUST DO:**
- Use `Timestamp.now()` for all date fields, never `new Date()`
- Include `orgId` on EVERY document (tenant isolation)
- Use composite IDs for memberships: `${userId}_${orgId}`
- Use flat collections only (no subcollections)
- Import modular SDK: `import { getFirestore } from 'firebase/firestore'`

**NEVER DO:**
- Never expose Firebase Admin SDK to client bundles
- Never use `firebase/compat/*` imports
- Never store user sessions in Firestore (use cookies)
- Never query without `orgId` filter (except `users` collection)

```typescript
// CORRECT
import { collection, query, where } from 'firebase/firestore'
const q = query(collection(db, 'tasks'), where('orgId', '==', currentOrgId))

// WRONG - missing orgId filter
const q = query(collection(db, 'tasks'))
```

### Authentication Rules

**Session Cookie Pattern (Required for Vercel):**
```typescript
// Server: Create session cookie
const sessionCookie = await adminAuth.createSessionCookie(idToken, {
  expiresIn: 60 * 60 * 24 * 5 * 1000 // 5 days
})

// Set HTTP-only cookie
cookies().set('session', sessionCookie, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/'
})
```

**NEVER DO:**
- Never store Firebase ID tokens in localStorage
- Never pass tokens via URL parameters
- Never skip middleware validation for dashboard routes

### Zustand Store Rules

**Store Structure:**
```typescript
// CORRECT pattern
interface TasksState {
  tasks: Task[]
  isLoading: boolean
  error: string | null

  // Actions: verb + Noun
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
}
```

**Optimistic Updates (Required):**
```typescript
updateTask: async (id, updates) => {
  const previous = get().tasks.find(t => t.id === id)

  // 1. Optimistic update FIRST
  set(state => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  }))

  try {
    await updateTaskInFirestore(id, updates)
  } catch {
    // 2. Rollback on failure
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? previous : t)
    }))
    toast.error('Failed to update task')
  }
}
```

### API Pattern Rules

**Route Handlers vs Server Actions:**

| Use Route Handlers (`/api/*`) | Use Server Actions (`'use server'`) |
|-------------------------------|-------------------------------------|
| AI streaming responses | Form submissions |
| Webhook endpoints | CRUD mutations |
| Cron jobs | Settings updates |
| External API calls | Team management |

**Response Format (Always):**
```typescript
// Success
return Response.json({ success: true, data: result })

// Error
return Response.json({
  success: false,
  error: { code: 'ERROR_CODE', message: 'User-friendly message' }
}, { status: 400 })
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Firestore fields | camelCase | `orgId`, `createdAt`, `isActive` |
| Components | PascalCase.tsx | `TaskCard.tsx` |
| Utilities | camelCase.ts | `formatDate.ts` |
| Stores | use + Name + Store.ts | `useTasksStore.ts` |
| Zustand actions | verb + Noun | `addTask`, `setLoading` |
| API routes | kebab-case | `/api/ai/content-history` |
| Error codes | SCREAMING_SNAKE | `AUTH_REQUIRED`, `RATE_LIMITED` |

---

## Testing Rules

**Test Location:** Co-located with source files
```
components/features/kanban/
├── TaskCard.tsx
├── TaskCard.test.tsx    # Same directory
```

**Firebase Mocking:**
```typescript
// Mock Firestore in tests
jest.mock('@/lib/firebase/client', () => ({
  db: mockFirestore,
  auth: mockAuth
}))
```

**What to Test:**
- Zustand store actions and state changes
- Component rendering with different states
- Form validation with Zod schemas
- API response handling

**What NOT to Test:**
- shadcn/ui component internals
- Firebase SDK internals
- Third-party library behavior

---

## Code Quality Rules

**TypeScript Strict Mode:**
- No `any` types - use `unknown` and type guards
- No implicit returns - always explicit return types on exports
- No non-null assertions (`!`) without comment explaining why

**Import Order:**
```typescript
// 1. React/Next
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party
import { toast } from 'sonner'

// 3. Internal absolute (@/)
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { Button } from '@/components/ui/button'

// 4. Relative
import { TaskCard } from './TaskCard'
```

**Tailwind Classes:**
```typescript
// CORRECT - use cn() helper
import { cn } from '@/lib/utils'
<div className={cn('base-class', isActive && 'active-class')} />

// WRONG - string concatenation
<div className={`base-class ${isActive ? 'active-class' : ''}`} />
```

---

## Critical Don't-Miss Rules

### Security Anti-Patterns

- **NEVER** commit `.env.local` or any env file with secrets
- **NEVER** log sensitive data (tokens, passwords, API keys)
- **NEVER** trust client-side role checks alone (always validate server-side)
- **NEVER** expose Firebase Admin credentials to client

### Performance Anti-Patterns

- **NEVER** fetch data in useEffect for initial page data (use Server Components)
- **NEVER** create Firestore listeners without cleanup
- **NEVER** store large objects in Zustand without memoization
- **NEVER** use `'use client'` on pages that can be Server Components

### Firebase Anti-Patterns

- **NEVER** use `getDocs` when you need real-time (use `onSnapshot`)
- **NEVER** create indexes manually (let Firestore error messages guide you)
- **NEVER** store arrays you need to query inside (use flat collections)

### RBAC Enforcement

Always check permissions at THREE levels:
1. **Middleware** - Session valid, user exists
2. **Server Action/Route Handler** - Role permits this action
3. **Firestore Security Rules** - Final defense

```typescript
// In Server Action
const { user, role } = await getSessionUser()
if (!canEditMetrics(role)) {
  return { success: false, error: { code: 'PERMISSION_DENIED', message: 'Not authorized' }}
}
```

### Error Handling Pattern

```typescript
// User-facing (toast)
toast.error('Could not save. Please try again.')  // Short, no technical details

// Technical (console)
console.error('[TaskStore] Firestore error:', { taskId, code: error.code })
```

---

## File Structure Reference

```
src/
├── app/
│   ├── (public)/      # No auth required
│   ├── (auth)/        # Login/signup
│   ├── (dashboard)/   # Requires session
│   └── api/           # Route handlers
├── components/
│   ├── ui/            # shadcn/ui only
│   ├── features/      # Feature components
│   └── layout/        # Layout components
├── lib/
│   ├── firebase/      # Firebase init
│   ├── stores/        # Zustand stores
│   ├── actions/       # Server actions
│   └── validations/   # Zod schemas
├── hooks/             # Custom hooks
├── types/             # TypeScript types
└── middleware.ts      # Auth middleware
```

---

**Last Updated:** 2026-02-25
**Architecture Reference:** `_bmad-output/planning-artifacts/architecture.md`
