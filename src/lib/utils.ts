import { format, subDays, startOfDay } from 'date-fns'

export function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function fmtNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

export function fmtCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function fmtPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function fmtMultiplier(value: number): string {
  return `${value.toFixed(2)}x`
}

export function calcCTR(clicks: number, impressions: number): number {
  return impressions > 0 ? (clicks / impressions) * 100 : 0
}

export function calcCPC(spend: number, clicks: number): number {
  return clicks > 0 ? spend / clicks : 0
}

export function calcCPM(spend: number, impressions: number): number {
  return impressions > 0 ? (spend / impressions) * 1000 : 0
}

export function calcCPA(spend: number, conversions: number): number {
  return conversions > 0 ? spend / conversions : 0
}

export function calcROAS(revenue: number, spend: number): number {
  return spend > 0 ? revenue / spend : 0
}

export function calcCVR(conversions: number, clicks: number): number {
  return clicks > 0 ? (conversions / clicks) * 100 : 0
}

export function calcDelta(current: number, prior: number): number {
  if (prior === 0) return 0
  return ((current - prior) / prior) * 100
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatDisplayDate(dateStr: string): string {
  return format(new Date(dateStr + 'T00:00:00'), 'MMM d')
}

export function getPresetRange(preset: string): { from: Date; to: Date } {
  const to = startOfDay(new Date())
  const daysMap: Record<string, number> = { '7d': 6, '30d': 29, '90d': 89, '120d': 119 }
  const days = daysMap[preset] ?? 29
  return { from: subDays(to, days), to }
}
