'use client'

/**
 * ConnectIntegrationModal Component
 *
 * Modal for connecting new integrations.
 * Shows different fields based on integration type.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { ExternalLink, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { connectIntegration, fetchAppStoreApps } from '@/lib/actions/integrations'
import type { IntegrationType, ConnectIntegrationInput } from '@/types/integrations'
import { INTEGRATION_META } from '@/types/integrations'
import type { AppStoreApp } from '@/lib/integrations/appStoreConnectClient'

interface ConnectIntegrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: IntegrationType
  onSuccess: () => void
}

export function ConnectIntegrationModal({
  open,
  onOpenChange,
  type,
  onSuccess,
}: ConnectIntegrationModalProps) {
  const meta = INTEGRATION_META[type]

  // Form state
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [issuerId, setIssuerId] = useState('')
  const [keyId, setKeyId] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [serviceAccountJson, setServiceAccountJson] = useState('')
  const [appId, setAppId] = useState('')
  const [vendorNumber, setVendorNumber] = useState('')

  // App Store Connect apps state
  const [apps, setApps] = useState<AppStoreApp[]>([])
  const [isLoadingApps, setIsLoadingApps] = useState(false)
  const [appsLoaded, setAppsLoaded] = useState(false)
  const [appsError, setAppsError] = useState<string | null>(null)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName(meta.name)
      setApiKey('')
      setApiSecret('')
      setIssuerId('')
      setKeyId('')
      setPrivateKey('')
      setServiceAccountJson('')
      setAppId('')
      setVendorNumber('')
      setApps([])
      setAppsLoaded(false)
      setAppsError(null)
      setError(null)
    }
  }, [open, meta.name])

  /**
   * Load apps from App Store Connect using provided credentials.
   */
  const handleLoadApps = async () => {
    if (!issuerId || !keyId || !privateKey) {
      setAppsError('Please fill in all credential fields first')
      return
    }

    setIsLoadingApps(true)
    setAppsError(null)

    try {
      const result = await fetchAppStoreApps({
        issuerId,
        keyId,
        privateKey,
      })

      if (!result.success) {
        setAppsError(result.error.message)
        return
      }

      setApps(result.data)
      setAppsLoaded(true)

      // Auto-select first app if only one
      if (result.data.length === 1) {
        setAppId(result.data[0].id)
      }
    } catch (err) {
      console.error('Load apps error:', err)
      setAppsError('Failed to load apps. Please check your credentials.')
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
      const input: ConnectIntegrationInput = {
        type,
        name,
        apiKey: apiKey || undefined,
        apiSecret: apiSecret || undefined,
        issuerId: issuerId || undefined,
        keyId: keyId || undefined,
        privateKey: privateKey || undefined,
        serviceAccountJson: serviceAccountJson || undefined,
        config: {
          appStoreAppId: type === 'app_store_connect' ? appId : undefined,
          vendorNumber: type === 'app_store_connect' ? vendorNumber : undefined,
          playPackageName: type === 'google_play' ? appId : undefined,
        },
      }

      const result = await connectIntegration(input)
      if (!result.success) {
        setError(result.error.message)
        return
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Connect integration error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Render fields based on auth type.
   */
  const renderFields = () => {
    switch (type) {
      // App Store Connect - JWT auth
      case 'app_store_connect':
        return (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Apple Developer Account Required</p>
                  <p className="text-amber-700 mt-1">
                    You'll need to create an API key in App Store Connect under Users and Access.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuerId">Issuer ID</Label>
              <Input
                id="issuerId"
                value={issuerId}
                onChange={(e) => setIssuerId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                required
              />
              <p className="text-xs text-muted-foreground">
                Found in App Store Connect → Users and Access → Keys
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyId">Key ID</Label>
              <Input
                id="keyId"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                placeholder="XXXXXXXXXX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateKey">Private Key (.p8 content)</Label>
              <Textarea
                id="privateKey"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                rows={4}
                className="font-mono text-xs"
                required
              />
              <p className="text-xs text-muted-foreground">
                Paste the entire contents of your .p8 file
              </p>
            </div>

            {/* App Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select App</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadApps}
                  disabled={isLoadingApps || !issuerId || !keyId || !privateKey}
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
                <p className="text-xs text-muted-foreground">
                  Enter your credentials above, then click "Load Apps" to see your available apps.
                </p>
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
                Found in App Store Connect → Agreements, Tax, and Banking. Required to fetch download and revenue data.
              </p>
            </div>
          </>
        )

      // Google Play - Service Account auth
      case 'google_play':
        return (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Google Cloud Console Required</p>
                  <p className="text-blue-700 mt-1">
                    Create a service account with Play Developer API access in Google Cloud Console.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceAccountJson">Service Account JSON</Label>
              <Textarea
                id="serviceAccountJson"
                value={serviceAccountJson}
                onChange={(e) => setServiceAccountJson(e.target.value)}
                placeholder='{"type": "service_account", ...}'
                rows={6}
                className="font-mono text-xs"
                required
              />
              <p className="text-xs text-muted-foreground">
                Paste the entire JSON key file content
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appId">Package Name</Label>
              <Input
                id="appId"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="com.example.app"
              />
            </div>
          </>
        )

      // API Key auth (Stripe, Mixpanel, Intercom)
      case 'stripe':
      case 'mixpanel':
      case 'intercom':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={type === 'stripe' ? 'sk_live_...' : 'Enter your API key'}
                required
              />
            </div>

            {type === 'stripe' && (
              <div className="space-y-2">
                <Label htmlFor="apiSecret">Webhook Secret (optional)</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="whsec_..."
                />
              </div>
            )}
          </>
        )

      // OAuth integrations (would normally redirect)
      case 'slack':
      case 'github':
      case 'google_analytics':
      case 'notion':
      case 'linear':
        return (
          <div className="bg-muted rounded-md p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              This integration uses OAuth authentication.
            </p>
            <Button type="button" variant="outline" asChild>
              <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer">
                View Setup Instructions
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              OAuth setup would redirect you to {meta.name} to authorize.
              For now, enter credentials manually if available.
            </p>
            <div className="mt-4 space-y-2 text-left">
              <Label htmlFor="apiKey">Access Token (if available)</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter access token"
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{meta.icon}</span>
            Connect {meta.name}
          </DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
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

          {/* Documentation Link */}
          <div className="text-sm">
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              View {meta.name} Documentation
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
