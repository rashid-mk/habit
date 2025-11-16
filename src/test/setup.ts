import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase modules
vi.mock('../config/firebase', () => ({
  auth: {},
  db: {},
  functions: {},
}))
