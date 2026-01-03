/**
 * Get short date range string for albums
 * Examples:
 * - Same month: "Aug 2024"
 * - Same year, different months: "Jul - Sept 2024"
 * - Different years: "Feb 2021 - Sept 2024"
 */
export function getShortDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = startDate instanceof Date ? startDate : new Date(startDate)
  const end = endDate instanceof Date ? endDate : new Date(endDate)

  const userLocale = 'zh-CN' // Default to Chinese, can be made dynamic later
  
  const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) => {
    return date.toLocaleString(userLocale, {
      ...options,
      timeZone: 'UTC'
    })
  }

  const endDateLocalized = formatDate(end, {
    month: 'short',
    year: 'numeric'
  })

  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      // Same year and month
      return endDateLocalized
    } else {
      // Same year but different month
      const startMonthLocalized = formatDate(start, {
        month: 'short'
      })
      return `${startMonthLocalized} - ${endDateLocalized}`
    }
  } else {
    // Different year
    const startDateLocalized = formatDate(start, {
      month: 'short',
      year: 'numeric'
    })
    return `${startDateLocalized} - ${endDateLocalized}`
  }
}


