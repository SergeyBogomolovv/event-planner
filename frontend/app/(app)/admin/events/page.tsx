import { CalendarDays, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { AdminEventActions } from '@/components/admin-event-actions'
import { NoAccess } from '@/components/no-access'
import { PageHero } from '@/components/page-hero'
import { PaginationNav } from '@/components/pagination-nav'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { eventFormatLabels, eventStatusLabels, formatEventDate } from '@/lib/event-labels'
import { getAdminEvents, getCurrentUser } from '@/lib/server-api'

type AdminEventsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

const pageLimit = 20

export default async function AdminEventsPage({ searchParams }: AdminEventsPageProps) {
  const currentUser = await getCurrentUser()

  if (currentUser.role !== 'admin') {
    return <NoAccess />
  }

  const page = resolvePage((await searchParams).page)
  const events = await getAdminEvents({ page, limit: pageLimit })

  return (
    <div className='space-y-6'>
      <PageHero
        icon={CalendarDays}
        eyebrow='Администрирование'
        title='Мероприятия'
        description='Общий список событий и административное удаление.'
      />

      <Card className='overflow-hidden py-0 shadow-sm'>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[900px] text-left text-sm'>
              <thead className='bg-zinc-950 text-white'>
                <tr>
                  <Th>Мероприятие</Th>
                  <Th>Статус</Th>
                  <Th>Формат</Th>
                  <Th>Организатор</Th>
                  <Th>Участники</Th>
                  <Th>Начало</Th>
                  <Th>Действия</Th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {events.items.map((event) => (
                  <tr key={event.id} className='align-top'>
                    <Td>
                      <div className='max-w-sm space-y-1'>
                        <Link
                          href={`/events/${event.id}`}
                          className='font-medium hover:text-teal-800'
                        >
                          {event.title}
                        </Link>
                        <p className='line-clamp-2 text-muted-foreground'>{event.description}</p>
                      </div>
                    </Td>
                    <Td>
                      <Badge>{eventStatusLabels[event.status]}</Badge>
                    </Td>
                    <Td>{eventFormatLabels[event.format]}</Td>
                    <Td>
                      <div className='space-y-1'>
                        <p className='font-medium'>{event.organizer.name}</p>
                        <p className='break-all text-muted-foreground'>{event.organizer.email}</p>
                      </div>
                    </Td>
                    <Td>
                      <span className='inline-flex items-center gap-2'>
                        <UsersRound className='h-4 w-4 text-muted-foreground' />
                        {event.participantCount}
                      </span>
                    </Td>
                    <Td>{formatEventDate(event.startsAt)}</Td>
                    <Td>
                      <AdminEventActions eventId={event.id} title={event.title} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationNav basePath='/admin/events' page={events.page} totalPages={events.totalPages} />
        </CardContent>
      </Card>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className='px-4 py-3 font-medium'>{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className='px-4 py-4'>{children}</td>
}

function resolvePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number(raw ?? 1)
  return Number.isInteger(page) && page > 0 ? page : 1
}
