'use client'

/**
 * IntegrationsHub Component
 *
 * Main hub for managing third-party integrations.
 * Shows connected integrations and available ones to connect.
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  RefreshCw,
  Plug,
  PlugZap,
  ExternalLink,
  Settings,
  Trash2,
  RotateCw,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getIntegrations,
  disconnectIntegration,
  syncIntegration,
} from '@/lib/actions/integrations'
import { ConnectIntegrationModal } from './ConnectIntegrationModal'
import { EditIntegrationModal } from './EditIntegrationModal'
import type { Integration, IntegrationType } from '@/types/integrations'
import {
  INTEGRATION_TYPES,
  INTEGRATION_META,
  INTEGRATION_STATUS_LABELS,
  INTEGRATION_STATUS_COLORS,
} from '@/types/integrations'

// ========================================
// INTEGRATION CARD
// ========================================

interface IntegrationCardProps {
  integration: Integration
  onSync: () => void
  onDisconnect: () => void
  onSettings: () => void
}

function IntegrationCard({
  integration,
  onSync,
  onDisconnect,
  onSettings,
}: IntegrationCardProps) {
  const meta = INTEGRATION_META[integration.type]
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    await onSync()
    setIsSyncing(false)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.icon}</span>
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <CardDescription className="text-xs">{meta.name}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
                <RotateCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Now
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDisconnect} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <Badge
            variant="secondary"
            className={INTEGRATION_STATUS_COLORS[integration.status]}
          >
            {INTEGRATION_STATUS_LABELS[integration.status]}
          </Badge>
          {integration.lastSyncAt && (
            <span className="text-xs text-muted-foreground">
              Last sync:{' '}
              {new Date(integration.lastSyncAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
        {integration.lastError && (
          <p className="text-xs text-destructive mt-2">{integration.lastError}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ========================================
// AVAILABLE INTEGRATION CARD
// ========================================

interface AvailableIntegrationCardProps {
  type: IntegrationType
  onConnect: () => void
}

function AvailableIntegrationCard({ type, onConnect }: AvailableIntegrationCardProps) {
  const meta = INTEGRATION_META[type]

  return (
    <Card className="opacity-75 hover:opacity-100 transition-opacity">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.icon}</span>
            <div>
              <CardTitle className="text-base">{meta.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-1">
                {meta.description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {meta.category.replace('_', ' ')}
          </Badge>
          <Button size="sm" variant="outline" onClick={onConnect}>
            <Plug className="h-4 w-4 mr-1" />
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ========================================
// MAIN COMPONENT
// ========================================

export function IntegrationsHub() {
  // State
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Connect Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null)

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)

  /**
   * Fetch integrations.
   */
  const fetchIntegrations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getIntegrations()
      if (result.success) {
        setIntegrations(result.data)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err)
      setError('Failed to load integrations.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  /**
   * Handle sync.
   */
  const handleSync = async (integrationId: string) => {
    const result = await syncIntegration(integrationId)
    if (result.success) {
      fetchIntegrations()
    }
  }

  /**
   * Handle disconnect.
   */
  const handleDisconnect = async (integration: Integration) => {
    if (!confirm(`Disconnect ${integration.name}? This will stop syncing data.`)) return

    const result = await disconnectIntegration(integration.id)
    if (result.success) {
      setIntegrations((prev) => prev.filter((i) => i.id !== integration.id))
    } else {
      setError(result.error.message)
    }
  }

  /**
   * Handle connect click.
   */
  const handleConnectClick = (type: IntegrationType) => {
    setSelectedType(type)
    setIsModalOpen(true)
  }

  /**
   * Handle settings/edit click.
   */
  const handleSettingsClick = (integration: Integration) => {
    setSelectedIntegration(integration)
    setIsEditModalOpen(true)
  }

  /**
   * Handle modal success.
   */
  const handleSuccess = () => {
    fetchIntegrations()
  }

  // Connected types
  const connectedTypes = integrations.map((i) => i.type)

  // Available integrations (not yet connected)
  const availableTypes = INTEGRATION_TYPES.filter((t) => !connectedTypes.includes(t))

  // Group by category
  const categories = ['app_stores', 'analytics', 'development', 'communication', 'productivity'] as const

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect your tools to sync data automatically
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchIntegrations} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {/* Connected Integrations */}
      {!isLoading && integrations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <PlugZap className="h-4 w-4 text-green-500" />
            Connected ({integrations.length})
          </h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onSync={() => handleSync(integration.id)}
                onDisconnect={() => handleDisconnect(integration)}
                onSettings={() => handleSettingsClick(integration)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations by Category */}
      {!isLoading && availableTypes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-4">Available Integrations</h3>

          {categories.map((category) => {
            const categoryTypes = availableTypes.filter(
              (t) => INTEGRATION_META[t].category === category
            )
            if (categoryTypes.length === 0) return null

            return (
              <div key={category} className="mb-6">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {category.replace('_', ' ')}
                </h4>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {categoryTypes.map((type) => (
                    <AvailableIntegrationCard
                      key={type}
                      type={type}
                      onConnect={() => handleConnectClick(type)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* No Integrations */}
      {!isLoading && integrations.length === 0 && availableTypes.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Plug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Integrations</h3>
              <p className="text-muted-foreground">
                Integrations will appear here once available.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connect Modal */}
      {selectedType && (
        <ConnectIntegrationModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          type={selectedType}
          onSuccess={handleSuccess}
        />
      )}

      {/* Edit Modal */}
      {selectedIntegration && (
        <EditIntegrationModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          integration={selectedIntegration}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
