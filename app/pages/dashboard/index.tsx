import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { createOrderAction } from '../../../server/api/actions/order'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [note, setNote] = useState('')
  const [lastCreated, setLastCreated] = useState<{ referenceCode: string } | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: { customerName: string; customerEmail: string; note: string }) => createOrderAction({ data }),
    onSuccess: (order) => {
      setLastCreated({ referenceCode: order.referenceCode })
      setCustomerName('')
      setCustomerEmail('')
      setNote('')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim() || !customerEmail.trim() || !note.trim()) return
    createMutation.mutate({ customerName: customerName.trim(), customerEmail: customerEmail.trim(), note: note.trim() })
  }

  return (
    <div className='mx-auto max-w-2xl px-4 py-8'>
      <Card>
        <CardHeader>
          <CardTitle className='text-xl'>Neuen Auftrag erstellen</CardTitle>
          <CardDescription>
            Erstellen Sie einen Auftrag für Ihren Kunden. Der Kunde erhält eine E-Mail mit dem Referenzcode.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <form
            onSubmit={handleSubmit}
            className='space-y-4'
          >
            <div className='space-y-2'>
              <Label htmlFor='customerName'>Kundenname</Label>
              <Input
                id='customerName'
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder='Max Mustermann'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='customerEmail'>Kunden-E-Mail</Label>
              <Input
                id='customerEmail'
                type='email'
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder='max@beispiel.de'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='note'>Beschreibung</Label>
              <Input
                id='note'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Reparatur, Anfertigung, etc.'
                required
              />
            </div>
            <Button
              type='submit'
              disabled={createMutation.isPending || !customerName.trim() || !customerEmail.trim() || !note.trim()}
            >
              <Plus data-icon='inline-start' />
              Auftrag erstellen
            </Button>
          </form>

          {createMutation.isError && <p className='text-destructive text-sm'>Fehler: {createMutation.error.message}</p>}

          {lastCreated && (
            <div className='bg-muted/50 rounded-lg border p-4'>
              <p className='text-sm font-medium'>Auftrag erstellt!</p>
              <p className='text-muted-foreground text-sm'>
                Referenzcode: <span className='font-mono font-bold'>{lastCreated.referenceCode}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
