import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'

describe('界面语言', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  })

  it('默认使用简体中文，并可切换到英文', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '代理链接 → Clash YAML' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '转换' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to English' }))
    expect(screen.getByRole('heading', { name: 'Proxy links → Clash YAML' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Convert' })).toBeTruthy()
  })
})
