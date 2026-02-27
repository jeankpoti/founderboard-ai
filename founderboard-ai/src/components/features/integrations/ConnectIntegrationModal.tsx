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
import { ExternalLink, AlertTriangle } from 'lucide-react'
import { connectIntegration } from '@/lib/actions/integrations'
import type { IntegrationType, ConnectIntegrationInput } from '@/types/integrations'
import { INTEGRATION_META } from '@/types/integrations'

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
      setError(null)
    }
  }, [open, meta.name])

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

            <div className="space-y-2">
              <Label htmlFor="appId">App ID (optional)</Label>
              <Input
                id="appId"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="123456789"
              />
              <p className="text-xs text-muted-foreground">
                Your app's Apple ID number (found in App Store Connect)
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
