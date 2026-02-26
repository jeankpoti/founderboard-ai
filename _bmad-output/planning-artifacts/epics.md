---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: complete
completedAt: '2026-02-25'
inputDocuments:
  - name: "prd.md"
    path: "_bmad-output/planning-artifacts/prd.md"
    type: "prd"
  - name: "architecture.md"
    path: "_bmad-output/planning-artifacts/architecture.md"
    type: "architecture"
project_name: 'FounderBoard AI'
date: '2026-02-25'
---

# FounderBoard AI - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for FounderBoard AI, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Authentication & Onboarding (FR1-FR8)**
- FR1: Users can sign up with email and password
- FR2: Users can sign up with Google OAuth
- FR3: Users can sign in with existing credentials
- FR4: Users can sign out from any device
- FR5: Users can reset their password via email
- FR6: Users can complete guided onboarding flow after first sign-up
- FR7: System can validate user sessions on each request
- FR8: System can maintain user authentication state across browser sessions

**Organization & Team Management (FR9-FR19)**
- FR9: Users can create a new organization
- FR10: Organization owners can invite members via email
- FR11: Organization owners can assign roles to members (Admin, Member)
- FR12: Organization admins can invite members via email
- FR13: Organization admins can remove members from organization
- FR14: Organization owners can change member roles
- FR15: Organization owners can transfer ownership to another member
- FR16: Organization owners can delete the organization
- FR17: Users can belong to multiple organizations
- FR18: Users can switch between organizations they belong to
- FR19: System can isolate all data by organization (multi-tenant)

**Dashboard & Metrics (FR20-FR30)**
- FR20: Users can view dashboard with KPI cards showing key metrics
- FR21: Users can view MRR (Monthly Recurring Revenue) metric
- FR22: Users can view Active Users metric
- FR23: Users can view Churn Rate metric
- FR24: Users can view Trial Conversion metric
- FR25: Users can view MRR trend chart with 30/60/90 day ranges
- FR26: Users can manually enter and update metric values
- FR27: Users can see trend indicators (up/down/stable) on KPI cards
- FR28: Dashboard can update in real-time when data changes
- FR29: Users can view contextual tooltips explaining each metric
- FR30: Members with Viewer role can see dashboard in read-only mode

**AI Content Studio (FR31-FR41)**
- FR31: Users can access AI Content Studio interface
- FR32: Users can send messages to AI and receive streaming responses
- FR33: Users can select from pre-built content templates
- FR34: Users can generate Investor Update content using template
- FR35: Users can generate Pitch Deck Outline using template
- FR36: Users can generate Social Media Posts using template
- FR37: Users can view AI response as it streams in real-time
- FR38: Users can copy generated content to clipboard
- FR39: Users can regenerate content with same or modified prompt
- FR40: System can rate-limit AI requests per user (10/minute)
- FR41: AI can reference organization metrics in generated content

**Task Management (FR42-FR52)**
- FR42: Users can view task board with Kanban columns
- FR43: Users can create new tasks with title and description
- FR44: Users can edit existing task details
- FR45: Users can delete tasks
- FR46: Users can drag tasks between columns (Backlog, Todo, In Progress, Done)
- FR47: Users can assign tasks to organization members
- FR48: Users can filter tasks by assignee
- FR49: Users can see task assignments and status in real-time
- FR50: Task board can persist column state across sessions
- FR51: Admins and Owners can assign tasks to any member
- FR52: Members can only edit their own assigned tasks

**Settings & Profile (FR53-FR61)**
- FR53: Users can view and edit their profile information
- FR54: Users can update their display name
- FR55: Users can upload or change profile avatar
- FR56: Organization admins can edit organization settings
- FR57: Organization admins can change organization name
- FR58: Organization owners can view member list with roles
- FR59: Organization owners can manage billing settings (future)
- FR60: Users can toggle dark mode preference
- FR61: System can persist user preferences across sessions

**Landing & Public Pages (FR62-FR67)**
- FR62: Visitors can view landing page with product information
- FR63: Visitors can view feature highlights section
- FR64: Visitors can view pricing information (placeholder for MVP)
- FR65: Visitors can navigate to sign-up from landing page
- FR66: Visitors can navigate to sign-in from landing page
- FR67: Landing page can display call-to-action buttons

**System & Platform (FR68-FR74)**
- FR68: System can display loading states during data fetches
- FR69: System can display error messages when operations fail
- FR70: System can show toast notifications for user actions
- FR71: System can recover gracefully from network errors
- FR72: System can validate all user inputs before submission
- FR73: System can log errors for debugging purposes
- FR74: System can enforce role-based access control on all operations

### Non-Functional Requirements

**Performance (NFR-P1 to P7)**
- NFR-P1: Initial page load (TTI) < 2 seconds
- NFR-P2: Dashboard data refresh < 500ms
- NFR-P3: Task drag-drop feedback < 100ms perceived
- NFR-P4: AI first token response < 1 second
- NFR-P5: AI full response streaming continuous, no stalls
- NFR-P6: Form submission response < 1 second
- NFR-P7: Route navigation < 300ms

**Security (NFR-S1 to S8)**
- NFR-S1: All data encrypted in transit (TLS 1.2+)
- NFR-S2: All data encrypted at rest (Firestore default)
- NFR-S3: Multi-tenant data isolation (zero cross-org leakage)
- NFR-S4: Session management (secure HTTP-only cookies)
- NFR-S5: No client-side token exposure
- NFR-S6: Input validation (all inputs validated with Zod)
- NFR-S7: Rate limiting (AI endpoints: 10 req/min/user)
- NFR-S8: CSRF protection on all state-changing requests

**Scalability (NFR-SC1 to SC5)**
- NFR-SC1: 100 concurrent users (MVP)
- NFR-SC2: 500 organizations (12 months)
- NFR-SC3: 25 members per org (12 months)
- NFR-SC4: 1,000 tasks per org (12 months)
- NFR-SC5: 10,000 AI requests/day total (12 months)

**Reliability (NFR-R1 to R5)**
- NFR-R1: 99.5% uptime availability
- NFR-R2: No data loss (Firestore guarantees)
- NFR-R3: Graceful degradation on failures
- NFR-R4: Zero-downtime deployments
- NFR-R5: Automatic backups

**Accessibility (NFR-A1 to A4)**
- NFR-A1: Keyboard navigation for all interactive elements
- NFR-A2: WCAG AA color contrast (4.5:1 minimum)
- NFR-A3: Basic ARIA labels on key elements
- NFR-A4: Visible focus indicators on all inputs

**Integration (NFR-I1 to I4)**
- NFR-I1: Firebase Auth 99.9% availability
- NFR-I2: Firestore real-time sync < 500ms
- NFR-I3: Graceful fallback on AI provider errors
- NFR-I4: Sub-100ms rate limit checks (Upstash)

### Additional Requirements

**From Architecture Document:**
- Starter template: Layered initialization (Next.js → shadcn/ui → Firebase → Zustand/AI → Additional deps)
- Firebase session cookies (HTTP-only) required for Vercel deployment
- Firestore flat collections with orgId on all documents
- Zustand domain stores: useAuthStore, useOrgStore, useMetricsStore, useTasksStore, useAIStore, useUIStore
- Hybrid API pattern: Route Handlers for streaming/webhooks, Server Actions for mutations
- Rate limiting middleware with Upstash Redis
- Optimistic updates with rollback pattern in stores
- Error handling: toast for users, console.error for technical logs
- Three-layer RBAC: Middleware → Server Actions → Security Rules

### FR Coverage Map

| FR Range | Epic | Description |
|----------|------|-------------|
| FR1-FR8 | Epic 1 | Authentication & session management |
| FR9 | Epic 2 | Organization creation |
| FR10-FR16 | Epic 6 | Team invites, roles, ownership |
| FR17-FR19 | Epic 2 | Multi-org, switching, isolation |
| FR20-FR30 | Epic 3 | Dashboard KPIs, charts, real-time |
| FR31-FR41 | Epic 4 | AI Content Studio |
| FR42-FR52 | Epic 5 | Task board, Kanban, assignments |
| FR53-FR61 | Epic 6 | Settings, profile, preferences |
| FR62-FR67 | Epic 7 | Landing page, public pages |
| FR68-FR74 | Epic 1 | Platform: loading, errors, validation, RBAC |

## Epic List

### Epic 1: Project Foundation & Authentication
Users can register with email or Google, login securely, and access a polished app shell with error handling and loading states.

**FRs covered:** FR1-FR8, FR68-FR74
**User Value:** Complete auth system, app shell, error boundaries
**Dependencies:** None - this is the foundation
**Enables:** All subsequent epics

---

### Epic 2: Organization & Multi-Tenancy
Users can create their organization and switch between orgs they belong to, with complete data isolation.

**FRs covered:** FR9, FR17-FR19
**User Value:** Org creation, switching, tenant isolation
**Dependencies:** Epic 1 (Authentication)
**Enables:** All org-scoped features

---

### Epic 3: Dashboard & Metrics
Users can view their key business metrics (MRR, Users, Churn, Conversions) with trend charts and real-time updates.

**FRs covered:** FR20-FR30
**User Value:** Complete dashboard experience with KPIs and charts
**Dependencies:** Epic 1, Epic 2
**Enables:** AI can reference metrics for content generation

---

### Epic 4: AI Content Studio
Users can generate investor updates, pitch decks, and social posts using AI with streaming responses.

**FRs covered:** FR31-FR41
**User Value:** AI-powered content generation with templates
**Dependencies:** Epic 1, Epic 2, Epic 3 (for metric references)
**Enables:** Enhanced founder productivity

---

### Epic 5: Task Management
Users can manage tasks on a Kanban board with drag-drop, assignments, and real-time collaboration.

**FRs covered:** FR42-FR52
**User Value:** Complete task management system
**Dependencies:** Epic 1, Epic 2
**Enables:** Team productivity tracking

---

### Epic 6: Team & Settings
Users can invite team members, assign roles, and manage org/profile settings.

**FRs covered:** FR10-FR16, FR53-FR61
**User Value:** Complete team and settings management
**Dependencies:** Epic 1, Epic 2
**Enables:** Collaborative usage of all features

---

### Epic 7: Landing Page
Visitors can view product information, features, and pricing, then navigate to sign up.

**FRs covered:** FR62-FR67
**User Value:** Complete marketing presence
**Dependencies:** Epic 1 (links to auth pages)
**Enables:** User acquisition

---

## Epic 1: Project Foundation & Authentication

Users can register with email or Google, login securely, and access a polished app shell with error handling and loading states.

### Story 1.1: Project Scaffold & Core Setup

As a **developer**,
I want **a fully configured Next.js 15 project with all dependencies installed**,
So that **I have a solid foundation to build features on**.

**Acceptance Criteria:**

**Given** I run the starter template commands from architecture
**When** the project is initialized
**Then** Next.js 15 App Router is configured with TypeScript strict mode
**And** shadcn/ui is initialized with Button, Card, Input, Label, Dialog, Toast components
**And** Firebase client and admin SDKs are installed and configured
**And** Zustand, Vercel AI SDK, Upstash Redis are installed
**And** Tailwind CSS is configured with the design system
**And** The folder structure matches the architecture document
**And** Environment variables template (.env.example) is created

---

### Story 1.2: Email/Password Registration

As a **new user**,
I want **to create an account using my email and password**,
So that **I can access FounderBoard AI**.

**Acceptance Criteria:**

**Given** I am on the signup page
**When** I enter a valid email and password (min 8 chars)
**Then** my account is created in Firebase Auth
**And** a user document is created in Firestore `users` collection
**And** a session cookie is set (HTTP-only)
**And** I am redirected to the dashboard

**Given** I enter an email that already exists
**When** I submit the form
**Then** I see an error message "Email already in use"

**Given** I enter an invalid email or weak password
**When** I submit the form
**Then** I see validation errors before submission (Zod)

---

### Story 1.3: Google OAuth Registration

As a **new user**,
I want **to sign up with my Google account**,
So that **I can get started quickly without creating a password**.

**Acceptance Criteria:**

**Given** I am on the signup page
**When** I click "Continue with Google"
**Then** the Google OAuth popup appears
**And** after successful auth, my account is created
**And** my profile is populated from Google (name, email, avatar)
**And** a session cookie is set
**And** I am redirected to the dashboard

**Given** I cancel the Google OAuth popup
**When** the popup closes
**Then** I remain on the signup page with no error

---

### Story 1.4: User Login

As a **returning user**,
I want **to sign in with my credentials**,
So that **I can access my dashboard**.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I enter valid email and password
**Then** I am authenticated via Firebase
**And** a session cookie is set
**And** I am redirected to the dashboard

**Given** I enter incorrect credentials
**When** I submit the form
**Then** I see "Invalid email or password"

**Given** I click "Continue with Google"
**When** I complete OAuth with an existing account
**Then** I am logged in and redirected to dashboard

---

### Story 1.5: Session Management & Middleware

As a **user**,
I want **my session to persist securely across browser sessions**,
So that **I don't have to login every time**.

**Acceptance Criteria:**

**Given** I am logged in with a valid session
**When** I navigate to any dashboard route
**Then** the middleware validates my session cookie
**And** my user data is available in the request

**Given** my session cookie is expired or invalid
**When** I navigate to a protected route
**Then** I am redirected to the login page

**Given** I close and reopen my browser
**When** I return within 5 days
**Then** my session is still valid

---

### Story 1.6: Password Reset

As a **user who forgot their password**,
I want **to reset it via email**,
So that **I can regain access to my account**.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Forgot password"
**Then** I see a password reset form

**Given** I enter my registered email
**When** I submit the reset request
**Then** Firebase sends a password reset email
**And** I see confirmation message

**Given** I click the reset link in my email
**When** I enter a new password
**Then** my password is updated
**And** I can login with the new password

---

### Story 1.7: User Sign Out

As a **logged-in user**,
I want **to sign out of my account**,
So that **my session is secure on shared devices**.

**Acceptance Criteria:**

**Given** I am logged in
**When** I click "Sign out" in the user menu
**Then** my session cookie is cleared
**And** Firebase auth state is cleared
**And** I am redirected to the login page

**Given** I try to access a protected route after signing out
**When** the middleware checks my session
**Then** I am redirected to login

---

### Story 1.8: Platform Infrastructure

As a **user**,
I want **a polished app experience with loading states and error handling**,
So that **I always know what's happening**.

**Acceptance Criteria:**

**Given** any data is being fetched
**When** the request is in progress
**Then** I see appropriate loading skeletons or spinners

**Given** an operation succeeds (save, create, etc.)
**When** the action completes
**Then** I see a success toast notification

**Given** an operation fails
**When** an error occurs
**Then** I see an error toast with actionable message
**And** the error is logged to console for debugging

**Given** I submit any form
**When** the input is invalid
**Then** I see validation errors before submission

**Given** a route-level error occurs
**When** the error boundary catches it
**Then** I see a friendly error page with retry option

---

## Epic 2: Organization & Multi-Tenancy

Users can create their organization and switch between orgs they belong to, with complete data isolation.

### Story 2.1: Create Organization

As a **new user**,
I want **to create my first organization after signing up**,
So that **I have a workspace for my startup**.

**Acceptance Criteria:**

**Given** I am logged in with no organizations
**When** I complete the onboarding flow
**Then** I can enter an organization name
**And** an organization document is created in Firestore
**And** a membership record is created with role "owner"
**And** I am redirected to my new org's dashboard

**Given** I create an organization
**When** the org is saved
**Then** the org has a unique slug generated from the name
**And** my user document is updated with the linked orgId

---

### Story 2.2: Organization Data Isolation

As an **organization owner**,
I want **all my data to be isolated from other organizations**,
So that **my business information is private and secure**.

**Acceptance Criteria:**

**Given** I am viewing my dashboard
**When** any data query is executed
**Then** it includes `where('orgId', '==', currentOrgId)` filter

**Given** I try to access data from another organization
**When** the query executes
**Then** no data is returned (Security Rules enforce isolation)

**Given** I create metrics, tasks, or content
**When** the document is saved
**Then** it always includes the `orgId` field

---

### Story 2.3: Multi-Organization Membership

As a **user invited to multiple startups**,
I want **to belong to multiple organizations**,
So that **I can help different teams**.

**Acceptance Criteria:**

**Given** I am a member of Organization A
**When** I accept an invite to Organization B
**Then** a new membership record is created
**And** I can access both organizations

**Given** I have multiple memberships
**When** I view my profile
**Then** I see a list of all my organizations

---

### Story 2.4: Organization Switching

As a **user with multiple organizations**,
I want **to switch between my organizations**,
So that **I can work on different startups**.

**Acceptance Criteria:**

**Given** I am logged in with multiple orgs
**When** I click the org switcher in the sidebar
**Then** I see a dropdown of all my organizations

**Given** I select a different organization
**When** the switch completes
**Then** the dashboard reloads with that org's data
**And** the Zustand stores are cleared and repopulated
**And** the URL reflects the current org context

---

## Epic 3: Dashboard & Metrics

Users can view their key business metrics (MRR, Users, Churn, Conversions) with trend charts and real-time updates.

### Story 3.1: Dashboard Layout & KPI Cards

As a **founder**,
I want **to see my key metrics at a glance on the dashboard**,
So that **I understand my business health instantly**.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** the page loads
**Then** I see 4 KPI cards: MRR, Active Users, Churn Rate, Trial Conversions
**And** each card shows the current value
**And** each card shows a trend indicator (up/down/stable arrow)
**And** the layout is responsive

**Given** a metric has no data yet
**When** the dashboard loads
**Then** the card shows "No data" with an "Add" button

---

### Story 3.2: MRR Trend Chart

As a **founder**,
I want **to see my MRR trend over time**,
So that **I can track revenue growth**.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the MRR section
**Then** I see a line chart showing MRR over time

**Given** I have metric snapshots
**When** I select 30/60/90 day range
**Then** the chart updates to show that time period

**Given** I hover over a data point
**When** the tooltip appears
**Then** I see the exact value and date

---

### Story 3.3: Manual Metric Entry

As a **founder**,
I want **to manually enter and update my metrics**,
So that **I can track my business before integrations are set up**.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I click "Edit" on a KPI card
**Then** a modal opens with the current value

**Given** I enter a new metric value
**When** I save
**Then** the metric is updated in Firestore
**And** a snapshot is created with timestamp
**And** the KPI card updates immediately (optimistic)
**And** I see a success toast

**Given** I enter invalid data (negative, non-numeric)
**When** I try to save
**Then** I see validation errors

---

### Story 3.4: Real-Time Dashboard Updates

As a **team member**,
I want **to see dashboard updates in real-time**,
So that **I always have the latest numbers**.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** another team member updates a metric
**Then** my dashboard updates automatically (no refresh needed)

**Given** the Firestore listener is active
**When** data changes
**Then** the Zustand metricsStore updates
**And** components re-render with new data

---

### Story 3.5: Metric Tooltips & Guidance

As a **first-time founder**,
I want **to understand what each metric means**,
So that **I can interpret my business data correctly**.

**Acceptance Criteria:**

**Given** I hover over a metric card
**When** the tooltip appears
**Then** I see a brief explanation of the metric
**And** I see what "good" looks like for my stage

**Given** my churn rate is above 3%
**When** I view the card
**Then** I see a yellow/red indicator with guidance

---

### Story 3.6: Viewer Role Dashboard Access

As an **investor (Viewer role)**,
I want **to see the dashboard in read-only mode**,
So that **I can monitor my portfolio company**.

**Acceptance Criteria:**

**Given** I am logged in as a Viewer
**When** I view the dashboard
**Then** I see all KPI cards and charts
**And** I do NOT see edit buttons
**And** I cannot modify any metrics

---

## Epic 4: AI Content Studio

Users can generate investor updates, pitch decks, and social posts using AI with streaming responses.

### Story 4.1: AI Content Studio Interface

As a **founder**,
I want **to access the AI Content Studio**,
So that **I can generate content for my startup**.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to AI Studio
**Then** I see a chat-like interface with input field
**And** I see template options on the side
**And** I see my recent generations

---

### Story 4.2: AI Chat & Streaming Responses

As a **founder**,
I want **to send messages to AI and see streaming responses**,
So that **I get quick, interactive content generation**.

**Acceptance Criteria:**

**Given** I am in AI Studio
**When** I type a prompt and submit
**Then** the AI response streams in real-time (word by word)
**And** I see a loading indicator while generating
**And** the response renders as markdown

**Given** I want to cancel
**When** I click stop
**Then** the generation stops

---

### Story 4.3: Investor Update Template

As a **founder preparing investor updates**,
I want **to generate updates using a template**,
So that **I can create professional updates quickly**.

**Acceptance Criteria:**

**Given** I select "Investor Update" template
**When** the template loads
**Then** I see guided prompts for the update sections
**And** the AI pre-fills with my current metrics from dashboard

**Given** I generate the update
**When** streaming completes
**Then** I have a formatted investor update with headline metrics, key wins, challenges, and ask

---

### Story 4.4: Pitch Deck & Social Templates

As a **founder**,
I want **to generate pitch deck outlines and social posts**,
So that **I can create content for different purposes**.

**Acceptance Criteria:**

**Given** I select "Pitch Deck Outline" template
**When** I provide context about my startup
**Then** the AI generates a structured pitch deck outline

**Given** I select "Social Media Post" template
**When** I describe what I want to share
**Then** the AI generates platform-appropriate posts

---

### Story 4.5: Copy & Regenerate Content

As a **founder**,
I want **to copy generated content and regenerate if needed**,
So that **I can use the content efficiently**.

**Acceptance Criteria:**

**Given** AI has generated content
**When** I click "Copy"
**Then** the content is copied to clipboard
**And** I see a success toast

**Given** I'm not satisfied with the output
**When** I click "Regenerate"
**Then** a new response is generated with the same prompt

---

### Story 4.6: AI Rate Limiting

As a **system**,
I want **to rate limit AI requests**,
So that **costs are controlled and abuse is prevented**.

**Acceptance Criteria:**

**Given** a user makes AI requests
**When** they exceed 10 requests per minute
**Then** subsequent requests are blocked
**And** user sees "Rate limit exceeded. Please wait."

**Given** an org exceeds 100 requests per day
**When** they try another request
**Then** they see "Daily limit reached"

---

### Story 4.7: AI Metrics Context

As a **founder**,
I want **AI to reference my actual metrics**,
So that **generated content includes real numbers**.

**Acceptance Criteria:**

**Given** I generate an investor update
**When** the AI creates content
**Then** it includes my actual MRR, user count, etc.
**And** it calculates MoM changes correctly

---

## Epic 5: Task Management

Users can manage tasks on a Kanban board with drag-drop, assignments, and real-time collaboration.

### Story 5.1: Kanban Board Layout

As a **founder**,
I want **to see my tasks organized on a Kanban board**,
So that **I can visualize my work pipeline**.

**Acceptance Criteria:**

**Given** I navigate to Tasks
**When** the page loads
**Then** I see 4 columns: Backlog, Todo, In Progress, Done
**And** tasks are displayed as cards in their columns
**And** the layout is responsive

---

### Story 5.2: Create Task

As a **founder**,
I want **to create new tasks**,
So that **I can track work items**.

**Acceptance Criteria:**

**Given** I am on the task board
**When** I click "Add Task"
**Then** a modal opens with title and description fields

**Given** I fill in task details
**When** I save
**Then** the task is created in Firestore with orgId
**And** it appears in the Backlog column (optimistic)
**And** I see a success toast

---

### Story 5.3: Edit & Delete Tasks

As a **founder**,
I want **to edit and delete tasks**,
So that **I can keep my board accurate**.

**Acceptance Criteria:**

**Given** I click on a task card
**When** the modal opens
**Then** I can edit title, description, assignee

**Given** I make changes and save
**When** the update completes
**Then** the task card reflects changes immediately

**Given** I click delete
**When** I confirm
**Then** the task is removed from Firestore
**And** it disappears from the board

---

### Story 5.4: Drag & Drop Tasks

As a **founder**,
I want **to drag tasks between columns**,
So that **I can update status quickly**.

**Acceptance Criteria:**

**Given** I am viewing the board
**When** I drag a task card
**Then** I see visual feedback (card follows cursor)

**Given** I drop in a different column
**When** the drop completes
**Then** the task status is updated (optimistic)
**And** Firestore is updated
**And** the card stays in the new column

**Given** Firestore update fails
**When** the rollback happens
**Then** the card returns to original column
**And** I see an error toast

---

### Story 5.5: Task Assignment

As a **team lead (Owner/Admin)**,
I want **to assign tasks to team members**,
So that **work is distributed clearly**.

**Acceptance Criteria:**

**Given** I am editing a task
**When** I click the assignee dropdown
**Then** I see all org members

**Given** I select an assignee
**When** I save
**Then** the task shows the assignee's avatar
**And** the assignee can see the task assigned to them

---

### Story 5.6: Filter Tasks by Assignee

As a **team member**,
I want **to filter tasks by assignee**,
So that **I can focus on my work**.

**Acceptance Criteria:**

**Given** I am on the task board
**When** I select "My Tasks" filter
**Then** I only see tasks assigned to me

**Given** I select "All Tasks"
**When** the filter clears
**Then** I see all org tasks

---

### Story 5.7: Real-Time Task Updates

As a **team member**,
I want **to see task changes in real-time**,
So that **the board is always current**.

**Acceptance Criteria:**

**Given** I am viewing the board
**When** another member moves a task
**Then** I see the card move on my screen

**Given** a task is created by someone else
**When** it's saved
**Then** it appears on my board

---

### Story 5.8: Member Task Permissions

As a **member (not admin)**,
I want **to only edit my assigned tasks**,
So that **I don't accidentally modify others' work**.

**Acceptance Criteria:**

**Given** I am a Member role
**When** I click on a task assigned to me
**Then** I can edit it

**Given** I click on a task assigned to someone else
**When** the modal opens
**Then** I see it in read-only mode

---

## Epic 6: Team & Settings

Users can invite team members, assign roles, and manage org/profile settings.

### Story 6.1: User Profile Settings

As a **user**,
I want **to view and edit my profile**,
So that **my information is up to date**.

**Acceptance Criteria:**

**Given** I navigate to Settings > Profile
**When** the page loads
**Then** I see my current name, email, avatar

**Given** I update my display name
**When** I save
**Then** my name is updated in Firestore
**And** it reflects across the app

---

### Story 6.2: Organization Settings

As an **org admin**,
I want **to edit organization settings**,
So that **the org reflects our brand**.

**Acceptance Criteria:**

**Given** I am an Admin or Owner
**When** I navigate to Settings > Organization
**Then** I can edit org name

**Given** I am a Member
**When** I try to access org settings
**Then** I see read-only view or restricted access

---

### Story 6.3: Invite Team Members

As an **org owner or admin**,
I want **to invite team members via email**,
So that **my team can collaborate**.

**Acceptance Criteria:**

**Given** I navigate to Settings > Team
**When** I click "Invite Member"
**Then** I see a form for email and role selection

**Given** I enter an email and select Member role
**When** I send the invite
**Then** an invitation document is created in Firestore
**And** I see the pending invite in the list

---

### Story 6.4: Accept Team Invitation

As an **invited user**,
I want **to accept an invitation to join an organization**,
So that **I can collaborate with the team**.

**Acceptance Criteria:**

**Given** I have an invitation link/token
**When** I click the link
**Then** I am directed to accept the invite

**Given** I am logged in
**When** I accept
**Then** a membership record is created
**And** the invitation is marked as accepted
**And** I can access the organization

---

### Story 6.5: Manage Team Members

As an **org owner**,
I want **to manage team member roles**,
So that **permissions are correct**.

**Acceptance Criteria:**

**Given** I view the team list
**When** I click on a member
**Then** I see their role and options

**Given** I am the Owner
**When** I change a member's role
**Then** their permissions update immediately

---

### Story 6.6: Remove Team Members

As an **org admin**,
I want **to remove team members**,
So that **former team members lose access**.

**Acceptance Criteria:**

**Given** I click "Remove" on a member
**When** I confirm
**Then** their membership is deleted
**And** they lose access immediately

---

### Story 6.7: Transfer Ownership

As an **org owner**,
I want **to transfer ownership to another member**,
So that **someone else can manage the org**.

**Acceptance Criteria:**

**Given** I am the Owner
**When** I select "Transfer Ownership"
**Then** I see a list of current members

**Given** I select a member and confirm
**When** the transfer completes
**Then** they become Owner
**And** I become Admin

---

### Story 6.8: Delete Organization

As an **org owner**,
I want **to delete the organization**,
So that **I can remove it completely**.

**Acceptance Criteria:**

**Given** I am the Owner
**When** I click "Delete Organization"
**Then** I see a confirmation with warnings

**Given** I type the org name to confirm
**When** I delete
**Then** all org data is deleted
**And** all members lose access

---

### Story 6.9: Dark Mode Toggle

As a **user**,
I want **to toggle dark mode**,
So that **I can use the app comfortably at night**.

**Acceptance Criteria:**

**Given** I am in settings
**When** I toggle dark mode
**Then** the UI switches theme immediately
**And** my preference is persisted

---

## Epic 7: Landing Page

Visitors can view product information, features, and pricing, then navigate to sign up.

### Story 7.1: Landing Page Hero

As a **visitor**,
I want **to see a compelling hero section**,
So that **I understand what FounderBoard AI does**.

**Acceptance Criteria:**

**Given** I visit the homepage
**When** the page loads
**Then** I see a headline explaining the product
**And** I see a subheadline with value proposition
**And** I see a primary CTA button "Get Started"

---

### Story 7.2: Features Section

As a **visitor**,
I want **to see the product features**,
So that **I understand what I'll get**.

**Acceptance Criteria:**

**Given** I scroll past the hero
**When** I reach the features section
**Then** I see cards for Dashboard, AI Studio, Task Board
**And** each card has an icon, title, and description

---

### Story 7.3: Pricing Section

As a **visitor**,
I want **to see pricing information**,
So that **I know if it fits my budget**.

**Acceptance Criteria:**

**Given** I view the pricing section
**When** it renders
**Then** I see "Free during MVP" or placeholder tiers

---

### Story 7.4: Navigation to Auth

As a **visitor**,
I want **to navigate to sign up or sign in**,
So that **I can start using the product**.

**Acceptance Criteria:**

**Given** I am on the landing page
**When** I click "Get Started" or "Sign Up"
**Then** I am redirected to /signup

**Given** I click "Sign In"
**When** navigating
**Then** I am redirected to /login

---

### Story 7.5: Landing Page Footer

As a **visitor**,
I want **to see footer information**,
So that **I can find additional resources**.

**Acceptance Criteria:**

**Given** I scroll to the bottom
**When** I view the footer
**Then** I see copyright information
**And** I see any relevant links

---

## Summary

| Epic | Stories | FRs Covered |
|------|---------|-------------|
| Epic 1: Foundation & Auth | 8 | FR1-FR8, FR68-FR74 |
| Epic 2: Organization | 4 | FR9, FR17-FR19 |
| Epic 3: Dashboard | 6 | FR20-FR30 |
| Epic 4: AI Studio | 7 | FR31-FR41 |
| Epic 5: Tasks | 8 | FR42-FR52 |
| Epic 6: Team & Settings | 9 | FR10-FR16, FR53-FR61 |
| Epic 7: Landing | 5 | FR62-FR67 |
| **Total** | **47 stories** | **74 FRs** |
