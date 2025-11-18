'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface DeleteCorrelationButtonProps {
  correlationId: string
  correlationName: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  redirectTo?: string
}

export default function DeleteCorrelationButton({
  correlationId,
  correlationName,
  variant = 'outline',
  size = 'sm',
  redirectTo = '/correlations'
}: DeleteCorrelationButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      const response = await fetch(`/api/correlations/${correlationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete correlation analysis')
      }

      // Redirect to correlations list
      router.push(redirectTo)
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete correlation analysis. Please try again.')
      setIsDeleting(false)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    // Only stop propagation to prevent parent Link from being triggered
    e.stopPropagation()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDeleting}
          onClick={handleButtonClick}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Correlation Analysis</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{correlationName}&quot;? This action cannot be undone.
            All correlation findings, insights, and AI-generated narratives will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
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
  )
}
