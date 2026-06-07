import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/legal/privacy')({
  component: LegalPrivacyPage,
})

function LegalPrivacyPage() {
  return (
    <div className='mx-auto w-full max-w-2xl px-4 py-8'>
      <h1 className='text-2xl font-bold'>Datenschutzerklärung</h1>
      <p className='text-muted-foreground mt-4'>Hier finden Sie Informationen zum Datenschutz bei StatusLine.</p>
    </div>
  )
}
