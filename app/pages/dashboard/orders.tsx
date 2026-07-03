import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronRight, ChevronLeft, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import {
  getOrdersAction,
  advanceOrderAction,
  revertOrderAction,
  deleteOrderAction,
} from '../../../server/api/actions/order'
import { getStatusesAction } from '../../../server/api/actions/statusSequence'

export const Route = createFileRoute('/dashboard/orders')({
  component: OrdersPage,
})

function OrdersPage() {
  const [filter, setFilter] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrdersAction(),
  })

  const { data: statuses = [], isLoading: statusesLoading } = useQuery({
    queryKey: ['statuses'],
    queryFn: () => getStatusesAction(),
  })

  const advance = useMutation({
    mutationFn: (orderId: string) => advanceOrderAction({ data: { orderId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  const revert = useMutation({
    mutationFn: (orderId: string) => revertOrderAction({ data: { orderId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  const deleteOrder = useMutation({
    mutationFn: (orderId: string) => deleteOrderAction({ data: { orderId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  if (ordersLoading || statusesLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <p className='text-muted-foreground'>Laden...</p>
      </div>
    )
  }

  const filtered = filter ? orders.filter((o) => o.currentStatusId === filter) : orders

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>Aufträge</CardTitle>
        <CardDescription>Alle Aufträge Ihres Shops im Überblick.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant={filter === null ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilter(null)}
          >
            Alle
          </Button>
          {statuses.map((s) => (
            <Button
              key={s.id}
              variant={filter === s.id ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter(s.id)}
            >
              {s.name}
            </Button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className='text-muted-foreground py-8 text-center text-sm'>Keine Aufträge gefunden.</p>
        ) : (
          <ul className='space-y-2'>
            {filtered.map((order) => {
              const sortedStatuses = [...statuses].toSorted((a, b) => a.position - b.position)
              const currentIndex = sortedStatuses.findIndex((s) => s.id === order.currentStatusId)
              const isFirst = currentIndex <= 0
              const isLast = currentIndex >= sortedStatuses.length - 1
              const isRemoved = currentIndex === -1

              return (
                <li
                  key={order.id}
                  className='bg-muted/50 flex items-center gap-3 rounded-lg border px-4 py-3'
                >
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium'>{order.customerName}</p>
                    <p className='text-muted-foreground truncate text-xs'>{order.note}</p>
                  </div>
                  <span className='font-mono text-xs'>{order.referenceCode}</span>
                  <span className='bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium'>
                    {order.statusName}
                  </span>
                  <div className='flex gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7'
                      disabled={isFirst && !isRemoved}
                      onClick={() => revert.mutate(order.id)}
                      title='Zurückstufen'
                    >
                      <ChevronLeft className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7'
                      disabled={isLast && !isRemoved}
                      onClick={() => advance.mutate(order.id)}
                      title='Vorrücken'
                    >
                      <ChevronRight className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-destructive hover:text-destructive h-7 w-7'
                      onClick={() => {
                        if (confirm(`Auftrag von ${order.customerName} (${order.referenceCode}) wirklich löschen?`)) {
                          deleteOrder.mutate(order.id)
                        }
                      }}
                      title='Löschen'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
