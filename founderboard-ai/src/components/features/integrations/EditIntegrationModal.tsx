'use client'

/**
 * EditIntegrationModal Component
 *
 * Modal for editing an existing integration's settings.
 * Allows changing app selection and configuration without reconnecting.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, RefreshCw } from 'lucide-react'
import { updateIntegration, fetchAppStoreAppsForIntegration } from '@/lib/actions/integrations'
import type { Integration } from '@/types/integrations'
import { INTEGRATION_META } from '@/types/integrations'
import type { AppStoreApp } from '@/lib/integrations/appStoreConnectClient'

interface EditIntegrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: Integration
  onSuccess: () => void
}

export function EditIntegrationModal({
  open,
  onOpenChange,
  integration,
  onSuccess,
}: EditIntegrationModalProps) {
  const meta = INTEGRATION_META[integration.type]

  // Form state
  const [name, setName] = useState('')
  const [appId, setAppId] = useState('')
  const [vendorNumber, setVendorNumber] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [slackChannel, setSlackChannel] = useState('')
  const [googleAnalyticsPropertyId, setGoogleAnalyticsPropertyId] = useState('')
  const [posthogProjectId, setPosthogProjectId] = useState('')
  const [posthogHost, setPosthogHost] = useState('')

  // App Store Connect apps state
  const [apps, setApps] = useState<AppStoreApp[]>([])
  const [isLoadingApps, setIsLoadingApps] = useState(false)
  const [appsLoaded, setAppsLoaded] = useState(false)
  const [appsError, setAppsError] = useState<string | null>(null)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form with current values when modal opens
  useEffect(() => {
    if (open && integration) {
      setName(integration.name)
      setAppId(integration.config?.appStoreAppId || '')
      setVendorNumber(integration.config?.vendorNumber || '')
      setGithubRepo(integration.config?.githubRepo || '')
      setSlackChannel(integration.config?.slackChannel || '')
      setGoogleAnalyticsPropertyId(integration.config?.googleAnalyticsPropertyId || '')
      setPosthogProjectId(integration.config?.posthogProjectId || '')
      setPosthogHost(integration.config?.posthogHost || '')
      setApps([])
      setAppsLoaded(false)
      setAppsError(null)
      setError(null)
    }
  }, [open, integration])

  /**
   * Load apps from App Store Connect using stored credentials.
   */
  const handleLoadApps = async () => {
    setIsLoadingApps(true)
    setAppsError(null)

    try {
      const result = await fetchAppStoreAppsForIntegration(integration.id)

      if (!result.success) {
        setAppsError(result.error.message)
        return
      }

      setApps(result.data)
      setAppsLoaded(true)

      // Pre-select current app if it exists in the list
      if (appId && result.data.some(app => app.id === appId)) {
        // Keep current selection
      } else if (result.data.length === 1) {
        // Auto-select first app if only one
        setAppId(result.data[0].id)
      }
    } catch (err) {
      console.error('Load apps error:', err)
      setAppsError('Failed to load apps.')
    } finally {
      setIsLoadingApps(false)
    }
  }

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updateIntegration(integration.id, {
        name: name !== integration.name ? name : undefined,
        config: {
          slackChannel: integration.type === 'slack' ? slackChannel || undefined : undefined,
          githubRepo: integration.type === 'github' ? githubRepo || undefined : undefined,
          appStoreAppId: integration.type === 'app_store_connect' ? appId || undefined : undefined,
          vendorNumber: integration.type === 'app_store_connect' ? vendorNumber || undefined : undefined,
          playPackageName: integration.type === 'google_play' ? appId || undefined : undefined,
          googleAnalyticsPropertyId:
            integration.type === 'google_analytics'
              ? googleAnalyticsPropertyId || undefined
              : undefined,
          posthogProjectId:
            integration.type === 'posthog' ? posthogProjectId || undefined : undefined,
          posthogHost: integration.type === 'posthog' ? posthogHost || undefined : undefined,
        },
      })

      if (!result.success) {
        setError(result.error.message)
        return
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Update integration error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Render fields based on integration type.
   */
  const renderFields = () => {
    switch (integration.type) {
      case 'app_store_connect':
        return (
          <>
            {/* App Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select App</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadApps}
                  disabled={isLoadingApps}
                >
                  {isLoadingApps ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Loading...
                    </>
                  ) : appsLoaded ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </>
                  ) : (
                    'Load Apps'
                  )}
                </Button>
              </div>

              {appsError && (
                <p className="text-xs text-destructive">{appsError}</p>
              )}

              {!appsLoaded ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Click &quot;Load Apps&quot; to see your available apps.
                  </p>
                  {appId && (
                    <p className="text-sm text-muted-foreground">
                      Current App ID: <span className="font-mono">{appId}</span>
                    </p>
                  )}
                </div>
              ) : apps.length === 0 ? (
                <p className="text-xs text-amber-600">
                  No apps found in your App Store Connect account.
                </p>
              ) : (
                <Select value={appId} onValueChange={setAppId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an app..." />
                  </SelectTrigger>
                  <SelectContent>
                    {apps.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        <div className="flex flex-col">
                          <span>{app.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {app.bundleId}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorNumber">Vendor Number (for downloads/revenue)</Label>
              <Input
                id="vendorNumber"
                value={vendorNumber}
                onChange={(e) => setVendorNumber(e.target.value)}
                placeholder="12345678"
              />
              <p className="text-xs text-muted-foreground">
                Found in App Store Connect &rarr; Agreements, Tax, and Banking. Required to fetch download and revenue data.
              </p>
            </div>
          </>
        )

      case 'google_play':
        return (
          <div className="space-y-2">
            <Label htmlFor="packageName">Package Name</Label>
            <Input
              id="packageName"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="com.example.app"
            />
          </div>
        )

      case 'github':
        return (
          <div className="space-y-2">
            <Label htmlFor="githubRepo">Repository</Label>
            <Input
              id="githubRepo"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="owner/repository"
            />
          </div>
        )

      case 'google_analytics':
        return (
          <div className="space-y-2">
            <Label htmlFor="googleAnalyticsPropertyId">GA4 Property ID</Label>
            <Input
              id="googleAnalyticsPropertyId"
              value={googleAnalyticsPropertyId}
              onChange={(e) => setGoogleAnalyticsPropertyId(e.target.value)}
              placeholder="123456789"
            />
          </div>
        )

      case 'slack':
        return (
          <div className="space-y-2">
            <Label htmlFor="slackChannel">Default Channel</Label>
            <Input
              id="slackChannel"
              value={slackChannel}
              onChange={(e) => setSlackChannel(e.target.value)}
              placeholder="#founderboard"
            />
          </div>
        )

      case 'posthog':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="posthogProjectId">Project ID</Label>
              <Input
                id="posthogProjectId"
                value={posthogProjectId}
                onChange={(e) => setPosthogProjectId(e.target.value)}
                placeholder="12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="posthogHost">PostHog Host</Label>
              <Input
                id="posthogHost"
                value={posthogHost}
                onChange={(e) => setPosthogHost(e.target.value)}
                placeholder="https://us.posthog.com"
              />
            </div>
          </>
        )

      default:
        return (
          <p className="text-sm text-muted-foreground">
            No additional settings available for this integration.
          </p>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{meta.icon}</span>
            Edit {integration.name}
          </DialogTitle>
          <DialogDescription>
            Update settings for this integration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`My ${meta.name}`}
              required
            />
          </div>

          {/* Type-specific fields */}
          {renderFields()}

          {/* Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
