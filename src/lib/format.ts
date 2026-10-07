import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import calendar from 'dayjs/plugin/calendar'

dayjs.extend(relativeTime)
dayjs.extend(calendar)

export const fromNow = (d: Date | string) => dayjs(d).fromNow()
export const dateTime = (d: Date | string) => dayjs(d).format('DD MMMM YYYY [ - ] HH:mm')
export const dateTimeSec = (d: Date | string) => dayjs(d).format('DD MMM YYYY HH:mm:ss')
export const dayKey = (d: Date | string) => dayjs(d).format('YYYY-MM-DD')
export const clock = (d: Date | string) => dayjs(d).format('HH:mm')
export const dayLabel = (day: string) => dayjs(day).calendar(null, {
  sameDay: '[Today]', nextDay: '[Tomorrow]', nextWeek: 'dddd', lastDay: '[Yesterday]', lastWeek: '[Last] dddd', sameElse: 'DD MMM YYYY'
})
