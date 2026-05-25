import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { lookupStatusAction } from '../../server/api/actions/order'

export const Route = createFileRoute('/status')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: (search.code as string) ?? '',
  }),
  component: StatusPage,
})

function StatusPage() {
  const { code } = Route.useSearch()
  const navigate = useNavigate()
  const [input, setInput] = useState(code)

  const {
    data: result,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['status-lookup', code],
    queryFn: () => lookupStatusAction({ data: { referenceCode: code } }),
    enabled: code.length > 0,
    retry: false,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim().toUpperCase()
    if (trimmed) {
      void navigate({ to: '/status', search: { code: trimmed } })
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center px-4'>
      <div className='w-full max-w-lg space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>Auftragsstatus prüfen</CardTitle>
            <CardDescription>
              Geben Sie Ihren Referenzcode ein, um den aktuellen Status Ihres Auftrags einzusehen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className='flex gap-2'
            >
              <div className='flex-1'>
                <Label
                  htmlFor='code'
                  className='sr-only'
                >
                  Referenzcode
                </Label>
                <Input
                  id='code'
                  placeholder='z.B. ABC123'
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
              <Button type='submit'>Suchen</Button>
            </form>
          </CardContent>
        </Card>

        {isLoading && <p className='text-muted-foreground text-center text-sm'>Laden...</p>}

        {code && !isLoading && !result && !error && (
          <Card>
            <CardContent className='py-6'>
              <p className='text-destructive text-center text-sm'>
                Referenzcode nicht gefunden. Bitte überprüfen Sie Ihre Eingabe.
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className='py-6'>
              <p className='text-destructive text-center text-sm'>
                Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
              </p>
            </CardContent>
          </Card>
        )}

        {result && (
          <ProgressBar
            statuses={result.statuses}
            currentPosition={result.currentPosition}
          />
        )}
      </div>
    </div>
  )
}

function ProgressBar({
  statuses,
  currentPosition,
}: {
  statuses: { name: string; position: number }[]
  currentPosition: number
}) {
  return (
    <Card>
      <CardContent className='py-6'>
        <div className='space-y-3'>
          {statuses.map((s, i) => {
            const isCompleted = s.position < currentPosition
            const isCurrent = s.position === currentPosition

            return (
              <div
                key={s.position}
                className='flex items-center gap-3'
              >
                <div className='flex flex-col items-center'>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted-foreground/30 text-muted-foreground/50'
                    }`}
                  >
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  {i < statuses.length - 1 && (
                    <div
                      className={`mt-1 h-4 w-0.5 ${
                        s.position < currentPosition ? 'bg-primary' : 'bg-muted-foreground/20'
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isCurrent ? 'text-primary font-semibold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {s.name}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
