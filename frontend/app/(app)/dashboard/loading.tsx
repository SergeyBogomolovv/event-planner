import { PageHero } from '@/components/page-hero'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className='space-y-6'>
      <PageHero title='Загрузка кабинета' eyebrow='Кабинет' />
      <div className='grid gap-4 xl:grid-cols-2'>
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} className='py-0 shadow-sm'>
            <CardHeader className='p-5'>
              <div className='h-6 w-44 rounded-md bg-muted' />
            </CardHeader>
            <CardContent className='space-y-3 px-5 pb-5'>
              <div className='h-24 rounded-lg bg-muted' />
              <div className='h-24 rounded-lg bg-muted' />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
