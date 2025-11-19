// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password strength validation
export interface PasswordStrength {
  score: number // 0-4 (0=very weak, 4=very strong)
  feedback: string[]
  isValid: boolean
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Password must be at least 8 characters long')
  }

  // Uppercase letter
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add at least one uppercase letter')
  }

  // Lowercase letter
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add at least one lowercase letter')
  }

  // Number
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Add at least one number')
  }

  // Special character
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add at least one special character (!@#$%^&*)')
  }

  // Bonus points for longer passwords
  if (password.length >= 12) {
    score = Math.min(score + 1, 5)
  }

  return {
    score: Math.min(score, 4),
    feedback,
    isValid: score >= 3 // Require at least 3/4 criteria
  }
}

export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'Very Weak'
    case 2:
      return 'Weak'
    case 3:
      return 'Good'
    case 4:
      return 'Strong'
    default:
      return 'Very Weak'
  }
}

export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-600 dark:text-red-400'
    case 2:
      return 'text-orange-600 dark:text-orange-400'
    case 3:
      return 'text-yellow-600 dark:text-yellow-400'
    case 4:
      return 'text-green-600 dark:text-green-400'
    default:
      return 'text-red-600 dark:text-red-400'
  }
}
