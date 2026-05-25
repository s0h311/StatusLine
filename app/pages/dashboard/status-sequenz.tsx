import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowUp, ArrowDown, Trash2, Bell, BellOff, Plus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import {
  getStatusesAction,
  addStatusAction,
  removeStatusAction,
  reorderStatusesAction,
  toggleNotifyAction,
} from '../../../server/api/actions/statusSequence'

export const Route = createFileRoute('/dashboard/status-sequenz')({
  component: StatusSequenzPage,
})

function StatusSequenzPage() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')

  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ['statuses'],
    queryFn: () => getStatusesAction(),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['statuses'] })

  const addMutation = useMutation({
    mutationFn: (name: string) => addStatusAction({ data: { name } }),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (statusId: string) => removeStatusAction({ data: { statusId } }),
    onSuccess: invalidate,
  })

  const toggleNotifyMutation = useMutation({
    mutationFn: (statusId: string) => toggleNotifyAction({ data: { statusId } }),
    onSuccess: invalidate,
  })

  const reorderMutation = useMutation({
    mutationFn: (statusIds: string[]) => reorderStatusesAction({ data: { statusIds } }),
    onSuccess: invalidate,
  })

  function moveStatus(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= statuses.length) return
    const ids = statuses.map((s) => s.id)
    const temp = ids[index]
    ids[index] = ids[newIndex] as string
    ids[newIndex] = temp as string
    reorderMutation.mutate(ids)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    addMutation.mutate(trimmed)
    setNewName('')
  }

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <p className='text-muted-foreground'>Laden...</p>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-2xl px-4 py-8'>
      <Card>
        <CardHeader>
          <CardTitle className='text-xl'>Status-Sequenz</CardTitle>
          <CardDescription>
            Verwalten Sie die Reihenfolge Ihrer Status. Aktivieren Sie die Glocke, um Kunden bei Statusänderungen per
            E-Mail zu benachrichtigen.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <form
            onSubmit={handleAdd}
            className='flex gap-2'
          >
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='Neuer Status...'
              className='flex-1'
            />
            <Button
              type='submit'
              disabled={addMutation.isPending || !newName.trim()}
            >
              <Plus data-icon='inline-start' />
              Hinzufügen
            </Button>
          </form>

          {statuses.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              Noch keine Status vorhanden. Fügen Sie Ihren ersten Status hinzu.
            </p>
          ) : (
            <ul className='space-y-2'>
              {statuses.map((status, index) => (
                <li
                  key={status.id}
                  className='bg-muted/50 flex items-center gap-2 rounded-lg border px-3 py-2'
                >
                  <span className='text-muted-foreground w-6 text-center text-xs font-medium'>{index + 1}</span>
                  <span className='flex-1 text-sm font-medium'>{status.name}</span>
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    onClick={() => toggleNotifyMutation.mutate(status.id)}
                    title={status.notify ? 'Benachrichtigung deaktivieren' : 'Benachrichtigung aktivieren'}
                  >
                    {status.notify ? <Bell className='text-primary' /> : <BellOff className='text-muted-foreground' />}
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    onClick={() => moveStatus(index, -1)}
                    disabled={index === 0}
                    title='Nach oben'
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    onClick={() => moveStatus(index, 1)}
                    disabled={index === statuses.length - 1}
                    title='Nach unten'
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant='destructive'
                    size='icon-xs'
                    onClick={() => removeMutation.mutate(status.id)}
                    title='Entfernen'
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
