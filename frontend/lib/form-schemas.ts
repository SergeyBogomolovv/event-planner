import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
})

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Введите имя').max(120, 'Слишком длинное имя'),
})

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Введите имя').max(120, 'Слишком длинное имя'),
  email: z.email('Введите корректный email'),
})

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(2, 'Введите название').max(160, 'Слишком длинное название'),
    description: z.string().trim().min(2, 'Введите описание').max(4000, 'Слишком длинное описание'),
    startsAt: z.string().min(1, 'Укажите начало'),
    endsAt: z.string().optional(),
    location: z.string().max(240, 'Слишком длинное значение').optional(),
    format: z.enum(['offline', 'online', 'hybrid']),
    participantLimit: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const startsAt = new Date(value.startsAt)
    if (Number.isNaN(startsAt.getTime())) {
      ctx.addIssue({ code: 'custom', path: ['startsAt'], message: 'Некорректная дата начала' })
    }

    if (value.endsAt) {
      const endsAt = new Date(value.endsAt)
      if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['endsAt'],
          message: 'Окончание должно быть позже начала',
        })
      }
    }

    if (value.participantLimit && Number(value.participantLimit) < 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['participantLimit'],
        message: 'Лимит должен быть больше нуля',
      })
    }
  })

export const userSearchSchema = z.object({
  query: z.string().trim().min(2, 'Введите минимум 2 символа').max(120, 'Слишком длинный запрос'),
})

export type AuthFormValues = z.infer<typeof registerSchema>
export type ProfileFormValues = z.infer<typeof profileSchema>
export type EventFormValues = z.infer<typeof eventFormSchema>
export type UserSearchFormValues = z.infer<typeof userSearchSchema>
