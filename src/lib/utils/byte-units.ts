/**
 * 字节单位转换工具
 * 参考 immich 的实现
 */

export function getByteUnitString(bytes: number, locale: string = 'zh-CN'): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = locale === 'zh-CN' 
    ? ['B', 'KB', 'MB', 'GB', 'TB']
    : ['B', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  
  // 格式化数字，保留最多2位小数，但如果是整数则不显示小数
  const formattedValue = value % 1 === 0 
    ? value.toString() 
    : value.toFixed(2)
  
  return `${formattedValue} ${sizes[i]}`
}

