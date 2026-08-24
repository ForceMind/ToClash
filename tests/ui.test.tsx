import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'

describe('界面语言', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  })
  afterEach(() => cleanup())

  it('默认使用简体中文，并可切换到英文', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '代理链接 → Clash YAML' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '转换' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to English' }))
    expect(screen.getByRole('heading', { name: 'Proxy links → Clash YAML' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Convert' })).toBeTruthy()
  })

  it('中文警告保留被忽略的参数名称', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('代理链接'), { target: { value: 'vless://00000000-0000-4000-8000-000000000000@example.com:443?unknown=value' } })
    fireEvent.click(screen.getByRole('button', { name: '转换' }))
    expect(screen.getByText('第 1 行：参数“unknown”当前无法映射到 Mihomo，已忽略。')).toBeTruthy()
  })

  it('引导用户添加始终直连和始终代理规则', () => {
    render(<App />)
    fireEvent.click(screen.getByText('自定义网站分流（可选）'))
    fireEvent.change(screen.getByLabelText('第 1 步：始终直连（绝不代理）'), { target: { value: 'bank.example' } })
    fireEvent.change(screen.getByLabelText('第 2 步：始终代理'), { target: { value: 'https://video.example/watch' } })
    fireEvent.change(screen.getByLabelText('代理链接'), { target: { value: 'vless://00000000-0000-4000-8000-000000000000@example.com:443' } })
    fireEvent.click(screen.getByRole('button', { name: '转换' }))
    const output = (screen.getByLabelText('Mihomo YAML') as HTMLTextAreaElement).value
    expect(output).toContain('DOMAIN-SUFFIX,bank.example,DIRECT')
    expect(output).toContain('DOMAIN-SUFFIX,video.example,PROXY')
  })
})
