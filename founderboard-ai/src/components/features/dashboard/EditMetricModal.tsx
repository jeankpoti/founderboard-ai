'use client'

import { useState, useEffect } from 'react'
import { updateMetric } from '@/lib/actions/metrics'
import { validateMetricValue } from '@/lib/validations/metrics'
import { METRIC_CONFIG, type MetricType } from '@/types/metrics'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface EditMetricModalProps {
  type: MetricType | null
  currentValue: number | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditMetricModal({
  type,
  currentValue,
  isOpen,
  onClose,
  onSuccess,
}: EditMetricModalProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const config = type ? METRIC_CONFIG[type] : null

  useEffect(() => {
    if (isOpen && currentValue !== null) {
      setValue(currentValue.toString())
    } else {
      setValue('')
    }
    setError(null)
  }, [isOpen, currentValue])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!type) return

    setError(null)
    const numValue = parseFloat(value)

    if (isNaN(numValue)) {
      setError('Please enter a valid number')
      return
    }

    const validationError = validateMetricValue(type, numValue)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    try {
      const result = await updateMetric({ type, value: numValue })

      if (!result.success) {
        setError(result.error.message)
        return
      }

      toast.success(`${config?.label} updated!`)
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Update metric error:', err)
      setError('Failed to update metric')
    } finally {
      setIsLoading(false)
    }
  }

  if (!type || !config) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update {config.label}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="value">
              {config.format === 'currency' && 'Value ($)'}
              {config.format === 'percent' && 'Value (%)'}
              {config.format === 'number' && 'Value'}
            </Label>
            <Input
              id="value"
              type="number"
              step={config.format === 'percent' ? '0.1' : '1'}
              min="0"
              max={config.format === 'percent' ? '100' : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter ${config.label.toLowerCase()}`}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
