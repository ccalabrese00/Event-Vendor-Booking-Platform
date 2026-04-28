import { formatCurrency, formatDate, formatDateTime, getStatusColor, getPaymentStatusColor } from '../formatters'

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats number as USD currency', () => {
      expect(formatCurrency(1500)).toBe('$1,500.00')
    })

    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('handles negative numbers', () => {
      expect(formatCurrency(-500)).toBe('-$500.00')
    })
  })

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const result = formatDate('2024-01-15T12:00:00')
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })

    it('formats Date object', () => {
      const result = formatDate(new Date('2024-01-15T12:00:00'))
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })
  })

  describe('formatDateTime', () => {
    it('formats date with time', () => {
      const result = formatDateTime('2024-01-15T10:30:00')
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })
  })

  describe('getStatusColor', () => {
    it('returns color for INQUIRY status', () => {
      expect(getStatusColor('INQUIRY')).toContain('yellow')
    })

    it('returns color for PENDING status', () => {
      expect(getStatusColor('PENDING')).toContain('orange')
    })

    it('returns color for ACCEPTED status', () => {
      expect(getStatusColor('ACCEPTED')).toContain('blue')
    })

    it('returns color for CONFIRMED status', () => {
      expect(getStatusColor('CONFIRMED')).toContain('green')
    })

    it('returns color for COMPLETED status', () => {
      expect(getStatusColor('COMPLETED')).toContain('purple')
    })

    it('returns color for CANCELLED status', () => {
      expect(getStatusColor('CANCELLED')).toContain('red')
    })

    it('returns default color for unknown status', () => {
      expect(getStatusColor('UNKNOWN')).toContain('gray')
    })
  })

  describe('getPaymentStatusColor', () => {
    it('returns color for PENDING payment', () => {
      expect(getPaymentStatusColor('PENDING')).toContain('yellow')
    })

    it('returns color for PAID payment', () => {
      expect(getPaymentStatusColor('PAID')).toContain('green')
    })

    it('returns color for REFUNDED payment', () => {
      expect(getPaymentStatusColor('REFUNDED')).toContain('red')
    })

    it('returns default color for unknown status', () => {
      expect(getPaymentStatusColor('UNKNOWN')).toContain('gray')
    })
  })
})
