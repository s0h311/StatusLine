import { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { authClient } from '@/libs/authClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/anmelden')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await authClient.signIn.email({
      email,
      password,
    })

    setLoading(false)

    if (result.error) {
      setError('E-Mail oder Passwort ist falsch.')
      return
    }

    void navigate({ to: '/dashboard' })
  }

  return (
    <div className='flex min-h-screen items-center justify-center px-4'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle className='text-2xl'>Anmelden</CardTitle>
          <CardDescription>Melde dich mit deiner E-Mail und deinem Passwort an.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className='flex flex-col gap-4'>
            {error && <p className='text-destructive text-sm'>{error}</p>}
            <div className='flex flex-col gap-2'>
              <Label htmlFor='email'>E-Mail</Label>
              <Input
                id='email'
                type='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='name@beispiel.de'
              />
            </div>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='password'>Passwort</Label>
              <Input
                id='password'
                type='password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className='flex flex-col gap-3'>
            <Button
              type='submit'
              className='w-full'
              disabled={loading}
            >
              {loading ? 'Wird angemeldet…' : 'Anmelden'}
            </Button>
            <p className='text-muted-foreground text-sm'>
              Noch kein Konto?{' '}
              <Link
                to='/registrieren'
                className='text-primary underline underline-offset-4'
              >
                Registrieren
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
