import { ProfileForm } from '@/components/profile-form'
import { PageHero } from '@/components/page-hero'
import { Card, CardContent } from '@/components/ui/card'
import { getProfile } from '@/lib/server-api'

export default async function ProfilePage() {
  const user = await getProfile()

  return (
    <div className='space-y-6'>
      <PageHero
        eyebrow='Профиль'
        title='Контактные данные'
        description='Обновите имя и email, которые будут видны в вашем кабинете.'
      />
      <Card className='py-0 shadow-sm'>
        <CardContent className='p-6'>
          <ProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
