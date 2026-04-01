'use client'

/**
 * InvestorDetailView Component
 *
 * The main view component for a single investor's details.
 * This is a client component because it needs interactivity:
 * - Edit investor information
 * - Add meetings
 * - Log interactions
 * - Change pipeline stage
 *
 * COMPONENT SECTIONS:
 * 1. Header: Name, firm, actions (edit, delete)
 * 2. Info Cards: Contact info, check size, focus areas
 * 3. Timeline: Meetings and interactions chronologically
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Twitter,
  Edit,
  Trash2,
  Calendar,
  MessageSquare,
  DollarSign,
  Target,
} from 'lucide-react'
import {
  deleteInvestor,
  moveInvestorToStage,
  getInvestorMeetings,
  getInvestorInteractions,
} from '@/lib/actions/investors'
import { InvestorModal } from '@/components/features/investors'
import type {
  Investor,
  InvestorStage,
  InvestorMeeting,
  InvestorInteraction,
} from '@/types/investors'
import {
  INVESTOR_STAGES,
  INVESTOR_STAGE_LABELS,
  INVESTOR_STAGE_COLORS,
  INVESTOR_TYPE_LABELS,
  MEETING_TYPE_LABELS,
  INTERACTION_TYPE_LABELS,
  INTERACTION_ICONS,
} from '@/types/investors'

// ========================================
// COMPONENT PROPS
// ========================================

interface InvestorDetailViewProps {
  /** The investor to display */
  investor: Investor
}

// ========================================
// HELPER COMPONENTS
// ========================================

/**
 * InfoItem - A small component for displaying labeled information.
 *
 * @param icon - Lucide icon component
 * @param label - Label text
 * @param value - Value to display
 * @param href - Optional link URL
 */
function InfoItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string
  href?: string
}) {
  const content = (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="p-2 rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    )
  }

  return content
}

/**
 * TimelineItem - Displays a single item in the activity timeline.
 */
function TimelineItem({
  icon,
  title,
  subtitle,
  time,
  children,
}: {
  icon: string
  title: string
  subtitle?: string
  time: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      {/* Icon */}
      <div className="flex flex-col items-center">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 w-px bg-border mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}

// ========================================
// MAIN COMPONENT
// ========================================

export function InvestorDetailView({ investor: initialInvestor }: InvestorDetailViewProps) {
  const router = useRouter()

  // Local state for investor (can be updated without page reload)
  const [investor, setInvestor] = useState<Investor>(initialInvestor)

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Loading state for stage change
  const [isChangingStage, setIsChangingStage] = useState(false)

  // Loading state for delete
  const [isDeleting, setIsDeleting] = useState(false)

  // Meetings and interactions
  const [meetings, setMeetings] = useState<InvestorMeeting[]>([])
  const [interactions, setInteractions] = useState<InvestorInteraction[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(true)

  /**
   * Fetch meetings and interactions for this investor.
   */
  const fetchActivity = useCallback(async () => {
    setIsLoadingActivity(true)
    try {
      const [meetingsResult, interactionsResult] = await Promise.all([
        getInvestorMeetings(investor.id),
        getInvestorInteractions(investor.id),
      ])

      if (meetingsResult.success) {
        setMeetings(meetingsResult.data)
      }
      if (interactionsResult.success) {
        setInteractions(interactionsResult.data)
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setIsLoadingActivity(false)
    }
  }, [investor.id])

  // Fetch activity on mount
  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  /**
   * Handle pipeline stage change.
   */
  const handleStageChange = async (newStage: string) => {
    setIsChangingStage(true)
    try {
      const result = await moveInvestorToStage(investor.id, newStage as InvestorStage)
      if (result.success) {
        setInvestor({ ...investor, stage: newStage as InvestorStage })
      }
    } catch (error) {
      console.error('Failed to change stage:', error)
    } finally {
      setIsChangingStage(false)
    }
  }

  /**
   * Handle investor deletion.
   */
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteInvestor(investor.id)
      if (result.success) {
        router.push('/investors')
      }
    } catch (error) {
      console.error('Failed to delete investor:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Handle successful edit.
   */
  const handleEditSuccess = (updatedInvestor: Investor) => {
    setInvestor(updatedInvestor)
  }

  /**
   * Format date for display.
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  /**
   * Format relative time (e.g., "2 hours ago").
   */
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return formatDate(dateString)
  }

  /**
   * Combine meetings and interactions into a single timeline.
   */
  const timelineItems = [
    ...meetings.map((m) => ({
      type: 'meeting' as const,
      id: m.id,
      title: m.title,
      subtitle: MEETING_TYPE_LABELS[m.meetingType],
      time: m.scheduledAt,
      icon: '📅',
      notes: m.notes,
    })),
    ...interactions.map((i) => ({
      type: 'interaction' as const,
      id: i.id,
      title: i.subject,
      subtitle: INTERACTION_TYPE_LABELS[i.type],
      time: i.createdAt,
      icon: INTERACTION_ICONS[i.type],
      content: i.content,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/investors"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Investors
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{investor.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            {investor.firm && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {investor.firm}
              </span>
            )}
            <Badge variant="secondary">
              {INVESTOR_TYPE_LABELS[investor.type]}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Investor</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {investor.name}? This will also delete
                  all associated meetings and interactions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Pipeline Stage Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Pipeline Stage</h3>
              <p className="text-sm text-muted-foreground">
                Move this investor through your fundraising pipeline
              </p>
            </div>
            <Select
              value={investor.stage}
              onValueChange={handleStageChange}
              disabled={isChangingStage}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVESTOR_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${INVESTOR_STAGE_COLORS[stage]}`}
                    >
                      {INVESTOR_STAGE_LABELS[stage]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {investor.email && (
              <InfoItem
                icon={Mail}
                label="Email"
                value={investor.email}
                href={`mailto:${investor.email}`}
              />
            )}
            {investor.phone && (
              <InfoItem
                icon={Phone}
                label="Phone"
                value={investor.phone}
                href={`tel:${investor.phone}`}
              />
            )}
            {investor.website && (
              <InfoItem
                icon={Globe}
                label="Website"
                value={investor.website}
                href={investor.website}
              />
            )}
            {investor.linkedInUrl && (
              <InfoItem
                icon={Linkedin}
                label="LinkedIn"
                value="View Profile"
                href={investor.linkedInUrl}
              />
            )}
            {investor.twitterHandle && (
              <InfoItem
                icon={Twitter}
                label="Twitter"
                value={investor.twitterHandle}
                href={`https://twitter.com/${investor.twitterHandle.replace('@', '')}`}
              />
            )}
            {!investor.email &&
              !investor.phone &&
              !investor.website &&
              !investor.linkedInUrl &&
              !investor.twitterHandle && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No contact information added yet
                </p>
              )}
          </CardContent>
        </Card>

        {/* Investment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Investment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {investor.checkSize && (
              <InfoItem
                icon={DollarSign}
                label="Check Size"
                value={`$${(investor.checkSize.min / 1000).toFixed(0)}K - $${(investor.checkSize.max / 1000).toFixed(0)}K ${investor.checkSize.currency}`}
              />
            )}
            {investor.focusAreas && investor.focusAreas.length > 0 && (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-md bg-muted">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Focus Areas</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {investor.focusAreas.map((area) => (
                    <Badge key={area} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {investor.source && (
              <InfoItem icon={MessageSquare} label="Source" value={investor.source} />
            )}
            {investor.referredBy && (
              <InfoItem
                icon={MessageSquare}
                label="Referred By"
                value={investor.referredBy}
              />
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {investor.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{investor.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Activity Timeline */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Activity Timeline</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Add Meeting
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-1" />
                Log Interaction
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading activity...
              </div>
            ) : timelineItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No activity yet</p>
                <p className="text-sm">
                  Schedule a meeting or log an interaction to track your engagement
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {timelineItems.map((item) => (
                  <TimelineItem
                    key={`${item.type}-${item.id}`}
                    icon={item.icon}
                    title={item.title}
                    subtitle={item.subtitle}
                    time={formatRelativeTime(item.time)}
                  >
                    {item.type === 'meeting' && item.notes && (
                      <p className="text-sm text-muted-foreground">{item.notes}</p>
                    )}
                    {item.type === 'interaction' && item.content && (
                      <p className="text-sm text-muted-foreground">{item.content}</p>
                    )}
                  </TimelineItem>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <InvestorModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        investor={investor}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
