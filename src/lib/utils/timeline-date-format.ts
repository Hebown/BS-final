import { DateTime } from 'luxon'

/**
 * 格式化月份组标题
 */
export function formatMonthGroupTitle(date: Date, locale: string = 'zh-CN'): string {
  const dt = DateTime.fromJSDate(date, { locale })
  
  if (!dt.isValid) {
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  }

  return dt.toLocaleString({
    month: 'long',
    year: 'numeric',
  })
}

/**
 * 格式化日期组标题
 */
export function formatGroupTitle(date: Date, locale: string = 'zh-CN'): string {
  const dt = DateTime.fromJSDate(date, { locale })
  
  if (!dt.isValid) {
    return date.toLocaleDateString(locale)
  }

  const today = DateTime.now().startOf('day')
  const dateStart = dt.startOf('day')

  // 今天
  if (today.hasSame(dateStart, 'day')) {
    return locale === 'zh-CN' ? '今天' : dt.toRelativeCalendar({ locale }) || 'Today'
  }

  // 昨天
  if (today.minus({ days: 1 }).hasSame(dateStart, 'day')) {
    return locale === 'zh-CN' ? '昨天' : dt.toRelativeCalendar({ locale }) || 'Yesterday'
  }

  // 本周内（过去6天）
  if (dateStart >= today.minus({ days: 6 }) && dateStart < today) {
    if (locale === 'zh-CN') {
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      return weekdays[dt.weekday % 7]
    }
    return dt.toLocaleString({ weekday: 'long' }, { locale })
  }

  // 今年内
  if (today.hasSame(dateStart, 'year')) {
    if (locale === 'zh-CN') {
      return dt.toLocaleString({
        month: 'long',
        day: 'numeric',
      })
    }
    return dt.toLocaleString({
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }, { locale })
  }

  // 其他年份
  if (locale === 'zh-CN') {
    return dt.toLocaleString({
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  
  return dt.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY, { locale })
}
