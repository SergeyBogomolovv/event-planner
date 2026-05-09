import { ShieldCheck, UsersRound } from 'lucide-react'
import { AdminUserActions } from '@/components/admin-user-actions'
import { NoAccess } from '@/components/no-access'
import { PageHero } from '@/components/page-hero'
import { PaginationNav } from '@/components/pagination-nav'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatLocalDate } from '@/lib/date-format'
import { getAdminUsers, getCurrentUser } from '@/lib/server-api'
import { userRoleLabels, userStatusLabels } from '@/lib/user-labels'

type AdminUsersPageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

const pageLimit = 20

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const currentUser = await getCurrentUser()

  if (currentUser.role !== 'admin') {
    return <NoAccess />
  }

  const page = resolvePage((await searchParams).page)
  const users = await getAdminUsers({ page, limit: pageLimit })

  return (
    <div className='space-y-6'>
      <PageHero
        icon={UsersRound}
        eyebrow='Администрирование'
        title='Пользователи'
        description='Список аккаунтов и управление доступом.'
      />

      <Card className='overflow-hidden py-0 shadow-sm'>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[760px] text-left text-sm'>
              <thead className='bg-zinc-950 text-white'>
                <tr>
                  <Th>Пользователь</Th>
                  <Th>Роль</Th>
                  <Th>Статус</Th>
                  <Th>Создан</Th>
                  <Th>Обновлён</Th>
                  <Th>Действия</Th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {users.items.map((user) => (
                  <tr key={user.id} className='align-top'>
                    <Td>
                      <div className='space-y-1'>
                        <p className='font-medium'>{user.name}</p>
                        <p className='break-all text-muted-foreground'>{user.email}</p>
                      </div>
                    </Td>
                    <Td>
                      <Badge variant='outline' className='gap-1'>
                        <ShieldCheck className='h-3.5 w-3.5' />
                        {userRoleLabels[user.role]}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'}>
                        {userStatusLabels[user.status]}
                      </Badge>
                    </Td>
                    <Td>{formatAdminDate(user.createdAt)}</Td>
                    <Td>{formatAdminDate(user.updatedAt)}</Td>
                    <Td>
                      <AdminUserActions user={user} currentUserId={currentUser.id} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationNav basePath='/admin/users' page={users.page} totalPages={users.totalPages} />
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

function formatAdminDate(value: string) {
  return formatLocalDate(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function resolvePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number(raw ?? 1)
  return Number.isInteger(page) && page > 0 ? page : 1
}
