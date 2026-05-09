'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { CalendarIcon, CalendarPlus, Save } from 'lucide-react'
import { ru } from 'date-fns/locale'
import type { EventFormat, EventItem } from '@/lib/api'
import { apiRequest } from '@/lib/api'
import { formatLocalDate } from '@/lib/date-format'
import { eventFormatLabels, toDateTimeLocal } from '@/lib/event-labels'
import { eventFormSchema, type EventFormValues } from '@/lib/form-schemas'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ValidatedField } from '@/components/validated-field'
import { cn } from '@/lib/utils'

type EventFormProps = {
  event?: EventItem
  mode: 'create' | 'edit'
}

export function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter()
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: getDefaultValues(event),
  })
  const [error, setError] = useState('')

  async function submit(values: EventFormValues) {
    setError('')

    try {
      const savedEvent = await apiRequest<EventItem>(
        mode === 'create' ? '/events' : `/events/${event?.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          body: JSON.stringify(toEventPayload(values)),
        },
      )

      router.push(`/events/${savedEvent.id}`)
      router.refresh()
    } catch {
      setError('Не удалось сохранить мероприятие. Проверьте поля и попробуйте ещё раз.')
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className='grid gap-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm'
    >
      <FieldGroup>
        <EventTitleAndFormat form={form} />
        <EventDescription form={form} />
        <EventDates form={form} />
        <EventLocationAndLimit form={form} />
      </FieldGroup>

      <div className='flex flex-wrap items-center gap-3'>
        <Button type='submit' disabled={form.formState.isSubmitting} className='h-11 gap-2'>
          {form.formState.isSubmitting ? (
            <Spinner />
          ) : mode === 'create' ? (
            <CalendarPlus className='h-4 w-4' />
          ) : (
            <Save className='h-4 w-4' />
          )}
          {form.formState.isSubmitting
            ? 'Сохранение...'
            : mode === 'create'
              ? 'Создать'
              : 'Сохранить'}
        </Button>
        {error ? (
          <Alert variant='destructive' className='w-auto'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </form>
  )
}

type EventFormApi = ReturnType<typeof useForm<EventFormValues>>

function EventTitleAndFormat({ form }: { form: EventFormApi }) {
  const selectedFormat = useWatch({ control: form.control, name: 'format' })

  return (
    <div className='grid gap-5 lg:grid-cols-[1.2fr_0.8fr]'>
      <ValidatedField
        htmlFor='event-title'
        label='Название'
        error={form.formState.errors.title?.message}
      >
        <Input
          id='event-title'
          className='h-12'
          maxLength={160}
          placeholder='Например, продуктовая встреча команды'
          aria-invalid={Boolean(form.formState.errors.title)}
          {...form.register('title')}
        />
      </ValidatedField>

      <ValidatedField label='Формат' error={form.formState.errors.format?.message}>
        <Select
          value={selectedFormat}
          items={Object.entries(eventFormatLabels).map(([value, label]) => ({
            label,
            value,
          }))}
          onValueChange={(value) =>
            form.setValue('format', value as EventFormat, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger
            className='h-12 w-full'
            aria-invalid={Boolean(form.formState.errors.format)}
          >
            <SelectValue>{eventFormatLabels[selectedFormat]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(eventFormatLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ValidatedField>
    </div>
  )
}

function EventDescription({ form }: { form: EventFormApi }) {
  return (
    <ValidatedField
      htmlFor='event-description'
      label='Описание'
      error={form.formState.errors.description?.message}
    >
      <Textarea
        id='event-description'
        className='min-h-40 resize-y'
        maxLength={4000}
        placeholder='Коротко опишите программу, формат и что участникам стоит подготовить.'
        aria-invalid={Boolean(form.formState.errors.description)}
        {...form.register('description')}
      />
    </ValidatedField>
  )
}

function EventDates({ form }: { form: EventFormApi }) {
  return (
    <div className='grid gap-5 md:grid-cols-2'>
      <EventDateTimeField form={form} name='startsAt' label='Начало' required />
      <EventDateTimeField form={form} name='endsAt' label='Окончание' />
    </div>
  )
}

function EventDateTimeField({
  form,
  label,
  name,
  required = false,
}: {
  form: EventFormApi
  label: string
  name: 'startsAt' | 'endsAt'
  required?: boolean
}) {
  const value = useWatch({ control: form.control, name })
  const error = form.formState.errors[name]?.message
  const selectedDate = parseDateTimeLocal(value)

  function setDate(date: Date | undefined) {
    if (!date) {
      if (!required) {
        form.setValue(name, '', { shouldDirty: true, shouldValidate: true })
      }
      return
    }

    form.setValue(name, combineDateAndTime(date, getTimePart(value) || '09:00'), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function setTime(time: string) {
    if (!time && !required && !getDatePart(value)) {
      form.setValue(name, '', { shouldDirty: true, shouldValidate: true })
      return
    }

    if (!selectedDate) {
      return
    }

    const date = selectedDate
    form.setValue(name, combineDateAndTime(date, time), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <ValidatedField label={label} error={error}>
      <div className='grid gap-2 sm:grid-cols-[1fr_130px]'>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type='button'
                variant='outline'
                className={cn(
                  'h-12 justify-start gap-2 px-3 text-left font-normal',
                  !selectedDate && 'text-muted-foreground',
                )}
                aria-invalid={Boolean(error)}
              />
            }
          >
            <CalendarIcon className='h-4 w-4' />
            {selectedDate ? formatDateLabel(selectedDate) : 'Выберите дату'}
          </PopoverTrigger>
          <PopoverContent align='start' className='w-auto p-0'>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={setDate}
              locale={ru}
              captionLayout='dropdown'
            />
          </PopoverContent>
        </Popover>
        <Input
          type='time'
          className='h-12'
          placeholder='09:00'
          value={getTimePart(value)}
          disabled={!selectedDate}
          aria-invalid={Boolean(error)}
          onChange={(event) => setTime(event.target.value)}
        />
      </div>
    </ValidatedField>
  )
}

function EventLocationAndLimit({ form }: { form: EventFormApi }) {
  return (
    <div className='grid gap-5 md:grid-cols-[1fr_220px]'>
      <ValidatedField
        htmlFor='event-location'
        label='Место или ссылка'
        error={form.formState.errors.location?.message}
      >
        <Input
          id='event-location'
          className='h-12'
          maxLength={240}
          placeholder='Адрес, переговорная или ссылка на видеозвонок'
          aria-invalid={Boolean(form.formState.errors.location)}
          {...form.register('location')}
        />
      </ValidatedField>
      <ValidatedField
        htmlFor='event-participant-limit'
        label='Лимит мест'
        error={form.formState.errors.participantLimit?.message}
      >
        <Input
          id='event-participant-limit'
          min={1}
          type='number'
          className='h-12'
          placeholder='Например, 20'
          aria-invalid={Boolean(form.formState.errors.participantLimit)}
          {...form.register('participantLimit')}
        />
      </ValidatedField>
    </div>
  )
}

function getDefaultValues(event?: EventItem): EventFormValues {
  return {
    title: event?.title ?? '',
    description: event?.description ?? '',
    startsAt: toDateTimeLocal(event?.startsAt ?? null),
    endsAt: toDateTimeLocal(event?.endsAt ?? null),
    location: event?.location ?? '',
    format: event?.format ?? 'offline',
    participantLimit: event?.participantLimit ? String(event.participantLimit) : '',
  }
}

function toEventPayload(values: EventFormValues) {
  return {
    title: values.title,
    description: values.description,
    startsAt: new Date(values.startsAt).toISOString(),
    endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : undefined,
    location: values.location ?? '',
    format: values.format,
    participantLimit: values.participantLimit ? Number(values.participantLimit) : undefined,
  }
}

function parseDateTimeLocal(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function getDatePart(value: string | undefined) {
  return value?.split('T')[0] ?? ''
}

function getTimePart(value: string | undefined) {
  return value?.split('T')[1]?.slice(0, 5) ?? ''
}

function combineDateAndTime(date: Date, time: string) {
  const [hours = '09', minutes = '00'] = time.split(':')
  const next = new Date(date)
  next.setHours(Number(hours), Number(minutes), 0, 0)
  const offset = next.getTimezoneOffset()
  return new Date(next.getTime() - offset * 60 * 1000).toISOString().slice(0, 16)
}

function formatDateLabel(date: Date) {
  return formatLocalDate(date, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
