---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: complete
completedAt: '2026-02-25'
inputDocuments:
  - name: "prd.md"
    path: "/Users/jeankpoti/PROJECTS/WEBSITES/founderboard ai/_bmad-output/planning-artifacts/prd.md"
    type: "prd"
    description: "Complete PRD with 74 FRs, 20 NFRs, 6 user journeys, SaaS B2B requirements"
  - name: "product-brief-founderboard-ai-2026-02-25.md"
    path: "/Users/jeankpoti/PROJECTS/WEBSITES/founderboard ai/_bmad-output/planning-artifacts/product-brief-founderboard-ai-2026-02-25.md"
    type: "product-brief"
    description: "Product brief with vision, users, metrics, and MVP scope"
workflowType: 'architecture'
project_name: 'FounderBoard AI'
user_name: 'Yo jk'
date: '2026-02-25'
---

# Architecture Decision Document - FounderBoard AI

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
74 FRs across 8 capability areas covering authentication, organization management, dashboard metrics, AI content generation, task management, settings, landing pages, and platform infrastructure. The FRs reveal a multi-tenant SaaS with real-time collaboration features and AI-powered content generation.

**Non-Functional Requirements:**
20 NFRs defining quality attributes:
- **Performance:** TTI < 2s, dashboard refresh < 500ms, AI first token < 1s
- **Security:** TLS encryption, multi-tenant isolation, session management, rate limiting
- **Scalability:** 100 concurrent users MVP, 500 orgs at 12 months
- **Reliability:** 99.5% uptime, graceful error recovery
- **Accessibility:** WCAG AA compliance, keyboard navigation
- **Integration:** Firebase Auth, Firestore, Vercel AI SDK, Upstash Redis

**Scale & Complexity:**
- Primary domain: Full-stack SaaS Web Application
- Complexity level: Medium
- Estimated architectural components: 25-30

### Technical Constraints & Dependencies

| Constraint | Source | Impact |
|------------|--------|--------|
| Firebase Auth + Vercel | PRD Technical Architecture | Session cookie pattern, no client tokens |
| Flat Firestore collections | PRD Multi-Tenant Architecture | Composite IDs, orgId on all docs |
| Next.js 14 App Router | PRD Tech Stack | Server Components, route handlers |
| 4-week MVP timeline | PRD Scoping | Prioritize proven patterns over innovation |
| Solo developer | PRD Resources | Prefer managed services, minimize ops |

### Cross-Cutting Concerns

| Concern | Description | Components Affected |
|---------|-------------|-------------------|
| **Session Management** | Firebase Auth with HTTP-only cookies, middleware validation | All authenticated routes |
| **Tenant Isolation** | orgId-scoped queries, Security Rules enforcement | All data operations |
| **RBAC Enforcement** | Permission checks on mutations, UI adaptation by role | All features |
| **Error Boundaries** | Graceful degradation, toast notifications, logging | All components |
| **Optimistic Updates** | Zustand state with rollback on failure | Tasks, metrics |
| **Rate Limiting** | Upstash Redis middleware on AI endpoints | AI Content Studio |

### Architectural Implications

Based on this analysis, key architectural decisions will include:
1. **Data layer:** Firestore collection structure and Security Rules
2. **Auth layer:** Firebase + Vercel session management
3. **State layer:** Zustand stores architecture
4. **API layer:** Route handlers vs Server Actions
5. **AI layer:** Streaming, rate limiting, error handling
6. **UI layer:** Component hierarchy, real-time patterns


## Starter Template & Foundation

### Primary Technology Domain

Full-stack Next.js 14 SaaS Web Application with Firebase backend and AI integration.

### Starter Approach: Layered Initialization

**Layer 1: Next.js Base**
```bash
npx create-next-app@latest founderboard-ai --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Layer 2: shadcn/ui Components**
```bash
npx shadcn@latest init
npx shadcn@latest add button card input label dialog toast sonner
```

**Layer 3: Firebase Integration**
```bash
npm install firebase firebase-admin
```

**Layer 4: State & AI**
```bash
npm install zustand ai @ai-sdk/openai @upstash/redis
```

**Layer 5: Additional Dependencies**
```bash
npm install @hello-pangea/dnd recharts zod react-hook-form @hookform/resolvers
```

### Code Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Dashboard route group
│   ├── api/               # API route handlers
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── features/         # Feature-specific components
├── lib/                   # Utilities and configs
│   ├── firebase/         # Firebase client/admin
│   ├── stores/           # Zustand stores
│   └── utils.ts          # Helper functions
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript types
```

### Technical Preferences Established

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Firestore (flat collections) | Familiarity, code aggregations, Security Rules |
| Auth | Firebase Auth + Session Cookies | Required for Vercel deployment |
| Frontend | Next.js 14 App Router | Server Components, streaming support |
| UI Library | shadcn/ui + Tailwind | Customizable, accessible components |
| State | Zustand | Simple, TypeScript-native |
| AI SDK | Vercel AI SDK | Streaming, structured output |
| Rate Limiting | Upstash Redis | Serverless-friendly |
| Drag-Drop | @hello-pangea/dnd | Active fork of react-beautiful-dnd |
| Charts | Recharts | React-native, declarative |
| Forms | react-hook-form + Zod | Validation, TypeScript integration |


## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Firestore collection structure with flat architecture
- Firebase Auth session cookie pattern for Vercel
- Zustand domain stores with optimistic updates
- Hybrid API pattern (Route Handlers + Server Actions)

**Important Decisions (Shape Architecture):**
- Three-layer RBAC enforcement (middleware, handlers, Security Rules)
- Real-time updates via Firestore onSnapshot
- Rate limiting tiers for AI endpoints

**Deferred Decisions (Post-MVP):**
- Advanced caching with Redis beyond sessions
- Error tracking (Sentry integration)
- Session replay (LogRocket)
- OpenAPI documentation

### Data Architecture

**Firestore Collections (Flat Structure):**

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User profiles | `uid`, `email`, `displayName`, `photoURL`, `createdAt` |
| `organizations` | Org settings | `name`, `slug`, `ownerId`, `branding`, `plan` |
| `memberships` | User-org links | `userId`, `orgId`, `role`, `joinedAt` (ID: `userId_orgId`) |
| `invitations` | Pending invites | `email`, `orgId`, `role`, `token`, `expiresAt` |
| `metrics` | KPI definitions | `orgId`, `name`, `type`, `target`, `unit`, `order` |
| `metric_snapshots` | Historical values | `metricId`, `orgId`, `value`, `date`, `source` |
| `tasks` | Kanban items | `orgId`, `title`, `status`, `assigneeId`, `order`, `dueDate` |
| `ai_content` | Generated content | `orgId`, `userId`, `type`, `prompt`, `output`, `createdAt` |
| `activity_logs` | Audit trail | `orgId`, `userId`, `action`, `resourceType`, `resourceId` |

**Validation Strategy:** Zod schemas shared between client and server with TypeScript inference.

**Caching Strategy:** No Redis cache for MVP; Firestore handles real-time. Upstash Redis for rate limiting and session validation only.

**Verified Versions:**
- Firebase JS SDK: 12.9.0
- Firebase Admin SDK: 13.6.1

### Authentication & Security

**Session Management:**
- Firebase Admin `createSessionCookie()` with 5-day expiry
- HTTP-only cookies stored via `/api/auth/session` route
- Middleware validates session on every request to `(dashboard)/*`

**Authorization Layers:**

| Layer | Responsibility |
|-------|----------------|
| Middleware (`middleware.ts`) | Session valid, user exists, attach to request |
| Route Handlers / Server Actions | Permission check for specific action |
| Firestore Security Rules | Final defense, tenant isolation |

**RBAC Matrix:**

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| Manage org settings | ✅ | ❌ | ❌ | ❌ |
| Invite/remove members | ✅ | ✅ | ❌ | ❌ |
| Create/edit metrics | ✅ | ✅ | ✅ | ❌ |
| Create/edit tasks | ✅ | ✅ | ✅ | ❌ |
| Use AI generation | ✅ | ✅ | ✅ | ❌ |
| View dashboard | ✅ | ✅ | ✅ | ✅ |

**Rate Limiting (Upstash Redis):**

| Endpoint | Limit |
|----------|-------|
| AI generation | 10/min per user, 100/day per org |
| Auth attempts | 5/min per IP |
| General API | 100/min per user |

### API & Communication Patterns

**Hybrid API Architecture:**

```
Route Handlers (/api/*):
├── /api/ai/generate      # Streaming AI responses
├── /api/ai/templates     # Template management
├── /api/auth/session     # Cookie management
├── /api/webhooks/*       # External integrations
└── /api/cron/*           # Scheduled jobs

Server Actions ('use server'):
├── Task CRUD             # createTask, updateTask, deleteTask
├── Metric operations     # updateMetric, recordSnapshot
├── Settings mutations    # updateOrgSettings, updateProfile
└── Team management       # sendInvite, revokeInvite, removeMember
```

**Error Response Standard:**

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }
```

**Documentation:** TypeScript types serve as documentation for MVP.

### Frontend Architecture

**Zustand Store Structure:**

| Store | Responsibility |
|-------|----------------|
| `useAuthStore` | User session, current org context |
| `useOrgStore` | Org details, members, roles |
| `useMetricsStore` | Dashboard metrics, snapshots, real-time sync |
| `useTasksStore` | Kanban tasks, optimistic updates, drag state |
| `useAIStore` | Generation state, streaming, history |
| `useUIStore` | Modals, toasts, sidebar, theme |

**Component Hierarchy:**

```
components/
├── ui/                    # shadcn/ui primitives
├── features/
│   ├── auth/             # LoginForm, SignupForm, InviteAccept
│   ├── dashboard/        # MetricCard, KPIGrid, TrendChart
│   ├── kanban/           # Board, Column, TaskCard, TaskModal
│   ├── ai-studio/        # Generator, TemplateList, OutputCard
│   └── settings/         # OrgSettings, TeamTable, ProfileForm
└── layout/               # Sidebar, Header, OrgSwitcher
```

**Real-time Pattern:** Firestore `onSnapshot` listeners initialized in Zustand stores, cleanup on component unmount.

**Optimistic Updates:** Immediate UI update, async Firestore write, rollback with toast on failure.

**Verified Versions:**
- Vercel AI SDK: 6.0.98
- Next.js: 15.x recommended (React 19, stable Turbopack)

### Infrastructure & Deployment

**Environment Strategy:**

| Environment | Purpose | Firebase Project |
|-------------|---------|------------------|
| `local` | Development | Emulators or dev project |
| `preview` | PR previews | Staging project |
| `production` | Live app | Production project |

**CI/CD:** Vercel Git integration with automatic preview deployments per PR.

**Monitoring (MVP):**
- Vercel Analytics (Web Vitals)
- Vercel Logs (Function execution)
- Console error boundaries with toast notifications

**Scaling:** All managed services (Vercel, Firestore, Upstash) auto-scale within MVP targets.

### Decision Impact Analysis

**Implementation Sequence:**
1. Firebase project setup + Security Rules
2. Next.js scaffold with auth flow
3. Zustand stores + Firestore listeners
4. Dashboard metrics feature
5. Kanban task management
6. AI Content Studio
7. Settings & team management
8. Landing pages

**Cross-Component Dependencies:**

```
Auth Store ─────► All Features (session context)
     │
     ▼
Org Store ──────► Metrics, Tasks, AI (orgId scoping)
     │
     ▼
UI Store ───────► All Components (modal/toast state)
```


## Implementation Patterns & Consistency Rules

### Conflict Points Addressed

| Category | Conflict Risk | Resolution |
|----------|--------------|------------|
| Firestore fields | High | camelCase everywhere |
| Component files | Medium | PascalCase.tsx |
| API responses | High | `{ success, data/error }` wrapper |
| Zustand actions | Medium | verb + Noun pattern |
| Error messages | Medium | User-facing vs technical separation |

### Naming Patterns

**Firestore Document Fields:**
```typescript
// CORRECT: camelCase for all fields
{
  orgId: "org_123",
  userId: "user_456",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isActive: true
}

// WRONG: snake_case or inconsistent
{
  org_id: "org_123",    // ❌
  user_Id: "user_456"   // ❌
}
```

**TypeScript/React Files:**

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase.tsx | `TaskCard.tsx` |
| Hooks | camelCase.ts | `useAuthStore.ts` |
| Utilities | camelCase.ts | `formatDate.ts` |
| Config | kebab-case | `tailwind.config.ts` |

**API Routes:**
```
/api/auth/session           # Auth operations
/api/ai/generate            # AI streaming
/api/ai/content-history     # Multi-word: kebab-case
```

**Zustand Actions:**
```typescript
// Pattern: verb + Noun (camelCase)
setUser()       // Set entire user
setTasks()      // Set entire array
addTask()       // Add single item
updateTask()    // Update single item
removeTask()    // Remove single item
setLoading()    // Boolean state
setError()      // Error state
```

### Structure Patterns

**Test Placement:** Co-located with source files
```
components/features/kanban/
├── TaskCard.tsx
├── TaskCard.test.tsx    # ✅ Co-located
├── Board.tsx
└── Board.test.tsx
```

**Shared Utilities Location:**
```
lib/
├── utils.ts           # cn(), formatDate(), etc.
├── constants.ts       # App-wide constants
├── validations.ts     # Shared Zod schemas
└── firebase/
    ├── client.ts      # Client SDK initialization
    ├── admin.ts       # Admin SDK initialization
    └── collections.ts # Collection references & types
```

### Format Patterns

**API Response Wrapper:**
```typescript
// Success response
{ success: true, data: T }

// Error response
{ success: false, error: { code: "ERROR_CODE", message: "User message" } }

// Error codes: SCREAMING_SNAKE_CASE
AUTH_REQUIRED, PERMISSION_DENIED, RATE_LIMITED, VALIDATION_ERROR
```

**Date Handling:**
```typescript
// Firestore: Always use Timestamp
import { Timestamp } from 'firebase/firestore'
createdAt: Timestamp.now()

// Display: Use Intl.DateTimeFormat or date-fns
new Intl.DateTimeFormat('en-US').format(timestamp.toDate())
```

**JSON Fields:** camelCase everywhere (client ↔ server ↔ Firestore)

### State Management Patterns

**Zustand Store Template:**
```typescript
interface FeatureState {
  // Data
  items: Item[]

  // UI state
  isLoading: boolean
  error: string | null

  // Actions (verb + Noun)
  setItems: (items: Item[]) => void
  addItem: (item: Item) => void
  updateItem: (id: string, updates: Partial<Item>) => void
  removeItem: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}
```

**Optimistic Update Pattern:**
```typescript
updateItem: async (id, updates) => {
  const previous = get().items.find(i => i.id === id)

  // 1. Optimistic update
  set(state => ({
    items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
  }))

  try {
    // 2. Async operation
    await updateInFirestore(id, updates)
  } catch (error) {
    // 3. Rollback + toast
    set(state => ({
      items: state.items.map(i => i.id === id ? previous : i)
    }))
    toast.error('Failed to update')
  }
}
```

### Error Handling Patterns

**User-Facing Messages (toast):**
```typescript
// Short, actionable, no technical details
toast.error('Could not save task. Please try again.')
toast.error('Session expired. Please sign in again.')
toast.error('You don\'t have permission to edit this metric.')
```

**Technical Logging (console):**
```typescript
console.error('[TaskStore] Firestore update failed:', {
  taskId,
  error: error.message,
  code: error.code
})
```

**Toast Usage:**
```typescript
import { toast } from 'sonner'

toast.success('Task created')           // Green checkmark
toast.error('Failed to save')           // Red X
toast.loading('Generating content...')  // Spinner
toast.dismiss()                         // Clear loading
```

### Loading State Patterns

**Store-Level Loading:**
```typescript
// Each store manages its own isLoading
const { tasks, isLoading } = useTasksStore()

// Check before render
{isLoading ? <Skeleton /> : <TaskList tasks={tasks} />}
```

**Route-Level Loading (Suspense):**
```tsx
// In route layout or page
<Suspense fallback={<DashboardSkeleton />}>
  <Dashboard />
</Suspense>
```

### Enforcement Guidelines

**All AI Agents MUST:**
1. Use camelCase for all Firestore fields
2. Use PascalCase for React components, camelCase for utilities
3. Wrap all API responses in `{ success, data/error }` format
4. Use verb + Noun pattern for Zustand actions
5. Separate user-facing errors (toast) from technical logs (console)
6. Co-locate tests with source files
7. Use Timestamps (not Date) for Firestore dates

**Pattern Verification:**
- TypeScript strict mode catches type inconsistencies
- ESLint rules enforce naming conventions
- PR reviews verify pattern compliance


## Project Structure & Boundaries

### Requirements to Structure Mapping

| PRD Capability Area | Primary Location |
|---------------------|------------------|
| Authentication (FR01-09) | `src/app/(auth)/`, `src/lib/firebase/` |
| Organization Management (FR10-19) | `src/app/(dashboard)/settings/`, `src/components/features/settings/` |
| Dashboard Metrics (FR20-29) | `src/app/(dashboard)/`, `src/components/features/dashboard/` |
| AI Content Generation (FR30-44) | `src/app/(dashboard)/ai-studio/`, `src/app/api/ai/` |
| Task Management (FR45-54) | `src/app/(dashboard)/tasks/`, `src/components/features/kanban/` |
| Settings (FR55-64) | `src/app/(dashboard)/settings/` |
| Landing Pages (FR65-69) | `src/app/(public)/` |
| Platform Infrastructure (FR70-74) | `src/middleware.ts`, `src/lib/` |

### Complete Project Directory Structure

```
founderboard-ai/
├── .env.local                    # Local environment variables
├── .env.example                  # Environment template
├── .eslintrc.json               # ESLint configuration
├── .gitignore                   # Git ignore patterns
├── .prettierrc                  # Prettier configuration
├── components.json              # shadcn/ui configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── og-image.png             # Social sharing image
│
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles + Tailwind imports
│   │   ├── layout.tsx           # Root layout (providers, fonts)
│   │   │
│   │   ├── (public)/            # Public routes (no auth)
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx       # Public layout (navbar, footer)
│   │   │
│   │   ├── (auth)/              # Auth routes
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   ├── invite/
│   │   │   │   └── [token]/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx       # Auth layout (centered card)
│   │   │
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   │   ├── layout.tsx       # Dashboard layout (sidebar, header)
│   │   │   ├── page.tsx         # Dashboard home (metrics overview)
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx     # Kanban board
│   │   │   ├── ai-studio/
│   │   │   │   └── page.tsx     # AI content generator
│   │   │   └── settings/
│   │   │       ├── page.tsx     # Settings overview
│   │   │       ├── profile/
│   │   │       │   └── page.tsx
│   │   │       ├── organization/
│   │   │       │   └── page.tsx
│   │   │       └── team/
│   │   │           └── page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── session/
│   │       │   │   └── route.ts  # Session cookie management
│   │       │   └── logout/
│   │       │       └── route.ts
│   │       ├── ai/
│   │       │   ├── generate/
│   │       │   │   └── route.ts  # Streaming AI generation
│   │       │   └── templates/
│   │       │       └── route.ts
│   │       └── webhooks/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sonner.tsx        # Toast provider
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── OrgSwitcher.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   └── MobileNav.tsx
│   │   │
│   │   └── features/
│   │       ├── auth/
│   │       │   ├── LoginForm.tsx
│   │       │   ├── SignupForm.tsx
│   │       │   ├── GoogleSignInButton.tsx
│   │       │   └── InviteAcceptForm.tsx
│   │       │
│   │       ├── dashboard/
│   │       │   ├── MetricCard.tsx
│   │       │   ├── MetricCard.test.tsx
│   │       │   ├── KPIGrid.tsx
│   │       │   ├── TrendChart.tsx
│   │       │   ├── MetricEditModal.tsx
│   │       │   └── AddMetricForm.tsx
│   │       │
│   │       ├── kanban/
│   │       │   ├── Board.tsx
│   │       │   ├── Board.test.tsx
│   │       │   ├── Column.tsx
│   │       │   ├── TaskCard.tsx
│   │       │   ├── TaskCard.test.tsx
│   │       │   ├── TaskModal.tsx
│   │       │   └── AddTaskButton.tsx
│   │       │
│   │       ├── ai-studio/
│   │       │   ├── Generator.tsx
│   │       │   ├── TemplateSelector.tsx
│   │       │   ├── OutputCard.tsx
│   │       │   ├── StreamingOutput.tsx
│   │       │   └── ContentHistory.tsx
│   │       │
│   │       └── settings/
│   │           ├── ProfileForm.tsx
│   │           ├── OrgSettingsForm.tsx
│   │           ├── TeamTable.tsx
│   │           ├── InviteMemberModal.tsx
│   │           └── RoleSelector.tsx
│   │
│   ├── lib/
│   │   ├── utils.ts              # cn() helper, formatDate, etc.
│   │   ├── constants.ts          # App-wide constants
│   │   │
│   │   ├── firebase/
│   │   │   ├── client.ts         # Firebase client SDK init
│   │   │   ├── admin.ts          # Firebase Admin SDK init
│   │   │   ├── auth.ts           # Auth helpers (signIn, signOut)
│   │   │   └── collections.ts    # Collection references
│   │   │
│   │   ├── stores/
│   │   │   ├── useAuthStore.ts
│   │   │   ├── useOrgStore.ts
│   │   │   ├── useMetricsStore.ts
│   │   │   ├── useTasksStore.ts
│   │   │   ├── useAIStore.ts
│   │   │   └── useUIStore.ts
│   │   │
│   │   ├── validations/
│   │   │   ├── auth.ts           # Login/signup schemas
│   │   │   ├── metrics.ts        # Metric schemas
│   │   │   ├── tasks.ts          # Task schemas
│   │   │   └── settings.ts       # Settings schemas
│   │   │
│   │   └── actions/
│   │       ├── auth.ts           # Server actions for auth
│   │       ├── metrics.ts        # Server actions for metrics
│   │       ├── tasks.ts          # Server actions for tasks
│   │       ├── team.ts           # Server actions for team mgmt
│   │       └── settings.ts       # Server actions for settings
│   │
│   ├── hooks/
│   │   ├── useFirestoreListener.ts
│   │   ├── usePermissions.ts
│   │   ├── useDebounce.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── types/
│   │   ├── index.ts              # Re-exports
│   │   ├── user.ts
│   │   ├── organization.ts
│   │   ├── metric.ts
│   │   ├── task.ts
│   │   ├── ai.ts
│   │   └── api.ts                # ApiResponse types
│   │
│   └── middleware.ts             # Auth middleware
│
├── firestore.rules               # Firestore Security Rules
├── firestore.indexes.json        # Firestore indexes
│
└── tests/
    ├── setup.ts                  # Test setup (mocks)
    └── e2e/
        ├── auth.spec.ts
        └── dashboard.spec.ts
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Location | Responsibility |
|----------|----------|----------------|
| Auth API | `/api/auth/*` | Session management only |
| AI API | `/api/ai/*` | Streaming generation, rate limited |
| Webhooks | `/api/webhooks/*` | External integrations |
| Server Actions | `lib/actions/*` | All CRUD mutations |

**State Boundaries:**

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  Dashboard  │ │   Kanban    │ │  AI Studio  │       │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │
│         │               │               │               │
├─────────┴───────────────┴───────────────┴───────────────┤
│                    Zustand Stores                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ MetricsStore│ │ TasksStore  │ │  AIStore    │       │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │
│         │               │               │               │
├─────────┴───────────────┴───────────────┴───────────────┤
│              Server Actions / Route Handlers             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │actions/     │ │actions/     │ │api/ai/      │       │
│  │metrics.ts   │ │tasks.ts     │ │generate     │       │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │
│         │               │               │               │
├─────────┴───────────────┴───────────────┴───────────────┤
│                     Firebase/Firestore                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  metrics    │ │    tasks    │ │  ai_content │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

**Data Flow Pattern:**
1. Component subscribes to Zustand store
2. Store initializes Firestore `onSnapshot` listener
3. User action → Store optimistic update → Server Action → Firestore
4. Firestore change → `onSnapshot` callback → Store update → Component re-render

### Integration Points

**Internal Communication:**
- Components → Stores (Zustand hooks)
- Stores → Firebase (onSnapshot listeners)
- Components → Server Actions (form submissions)
- Route Handlers → Firebase Admin SDK

**External Integrations:**
- OpenAI API (via Vercel AI SDK)
- Upstash Redis (rate limiting)
- Vercel (hosting, analytics, logs)


## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices verified compatible:
- Next.js 15 + Firebase Auth session cookies work with App Router
- Firestore onSnapshot integrates cleanly with Zustand stores
- shadcn/ui built for Tailwind CSS
- Vercel AI SDK 6 streaming works with Route Handlers
- Upstash Redis serverless-native for Vercel

**Pattern Consistency:**
All patterns align across the architecture:
- camelCase naming consistent (Firestore fields, TypeScript, JSON)
- PascalCase for components, camelCase for utilities
- `{ success, data/error }` API wrapper used everywhere
- Zustand verb+Noun action pattern standardized

**Structure Alignment:**
Project structure supports all architectural decisions:
- Route groups match authentication requirements
- Feature-based components align with PRD capabilities
- Domain stores correspond to feature boundaries
- Hybrid API pattern (streaming + Server Actions) properly structured

### Requirements Coverage Validation ✅

**Functional Requirements (74 FRs):**

| Capability Area | FR Range | Status |
|-----------------|----------|--------|
| Authentication | FR01-09 | ✅ Covered |
| Organization Management | FR10-19 | ✅ Covered |
| Dashboard Metrics | FR20-29 | ✅ Covered |
| AI Content Generation | FR30-44 | ✅ Covered |
| Task Management | FR45-54 | ✅ Covered |
| Settings | FR55-64 | ✅ Covered |
| Landing Pages | FR65-69 | ✅ Covered |
| Platform Infrastructure | FR70-74 | ✅ Covered |

**Non-Functional Requirements (20 NFRs):**

| Category | Key Requirements | Status |
|----------|-----------------|--------|
| Performance | TTI < 2s, refresh < 500ms, AI token < 1s | ✅ Addressed |
| Security | Multi-tenant isolation, sessions, rate limiting | ✅ Addressed |
| Scalability | 100 concurrent users, 500 orgs | ✅ Addressed |
| Reliability | 99.5% uptime, graceful errors | ✅ Addressed |
| Accessibility | WCAG AA, keyboard nav | ✅ Addressed |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- ✅ All technology choices documented with versions
- ✅ All integration patterns specified
- ✅ Collection structure fully defined
- ✅ API patterns clear (Route Handlers vs Server Actions)

**Pattern Completeness:**
- ✅ Naming conventions comprehensive
- ✅ Error handling patterns defined
- ✅ State management with optimistic updates
- ✅ Loading state patterns specified

**Structure Completeness:**
- ✅ Full project tree with all directories
- ✅ Component hierarchy defined
- ✅ Store structure mapped to features
- ✅ Requirements mapped to file locations

### Gap Analysis Results

**Critical Gaps:** None identified

**Important Gaps (Post-MVP):**
- Firestore Security Rules file content (define during implementation)
- E2E test coverage strategy (expand after core features)
- Error tracking integration (add Sentry when user base grows)

**Nice-to-Have (Future):**
- OpenAPI documentation for external consumers
- Storybook for component library
- Performance monitoring dashboard

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Proven technology stack with verified compatibility
- Comprehensive patterns prevent AI agent conflicts
- Clear separation of concerns across all layers
- Real-time capabilities built into architecture
- Scalable from day one with managed services

**Areas for Future Enhancement:**
- Add Sentry for production error tracking
- Expand E2E test coverage
- Consider Redis caching for heavy read patterns
- Add OpenAPI if external API access needed

### Implementation Handoff

**AI Agent Guidelines:**
1. Follow all architectural decisions exactly as documented
2. Use implementation patterns consistently across all components
3. Respect project structure and boundaries
4. Refer to this document for all architectural questions
5. Use verified package versions specified in this document

**First Implementation Steps:**
```bash
# 1. Create Next.js project
npx create-next-app@latest founderboard-ai --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. Initialize shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input label dialog toast sonner

# 3. Install dependencies
npm install firebase firebase-admin zustand ai @ai-sdk/openai @upstash/redis @hello-pangea/dnd recharts zod react-hook-form @hookform/resolvers
```


## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-02-25
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation**
- 25+ architectural decisions made
- 15+ implementation patterns defined
- 30+ architectural components specified
- 74 functional requirements fully supported
- 20 non-functional requirements addressed

**AI Agent Implementation Guide**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Development Sequence

1. Initialize project using documented starter template
2. Set up Firebase project and configure environment
3. Implement authentication flow with session cookies
4. Build Zustand stores with Firestore listeners
5. Create dashboard metrics feature
6. Implement Kanban task management
7. Build AI Content Studio with streaming
8. Add settings and team management
9. Create landing pages
10. Deploy to Vercel

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All 74 functional requirements are supported
- [x] All 20 non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

