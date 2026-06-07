import { Link } from '@tanstack/react-router'
import { cn } from '../libs/utils.ts'

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn(className, 'text-muted-foreground text-xs flex items-center gap-5 justify-center')}>
      <a href='https://rock-science.com/legal/impressum?source=StatusLine'>Impressum</a>

      <Link to='/legal/privacy'>Datenschutzerklärung</Link>
    </footer>
  )
}
