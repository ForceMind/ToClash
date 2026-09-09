import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { RuleSettings } from '../src/components/RuleSettings'
import { PRESET_CATEGORIES, RULE_PRESETS } from '../src/core/rules/presets'
import type { PresetId } from '../src/core/rules/types'

function Picker({ zh = true }: { zh?: boolean }) {
  const [presets, setPresets] = useState<Record<PresetId, boolean>>(
    () =>
      Object.fromEntries(RULE_PRESETS.map(({ id }) => [id, false])) as Record<
        PresetId,
        boolean
      >,
  )
  const [bypassCgnat, setBypassCgnat] = useState(false)
  return (
    <RuleSettings
      presets={presets}
      bypassCgnat={bypassCgnat}
      onPresetChange={(id, enabled) =>
        setPresets((current) => ({ ...current, [id]: enabled }))
      }
      onCgnatChange={setBypassCgnat}
      zh={zh}
    />
  )
}

describe('service preset picker', () => {
  afterEach(cleanup)

  it('searches Chinese and English service names and reports no results', () => {
    const tiktok = RULE_PRESETS.find((preset) => preset.id === 'tiktok')!
    const openai = RULE_PRESETS.find((preset) => preset.id === 'openai')!
    render(<Picker />)

    const search = screen.getByLabelText('搜索服务')
    fireEvent.change(search, { target: { value: 'TikTok' } })
    expect(screen.getByLabelText(tiktok.nameZh)).toBeTruthy()
    expect(screen.queryByLabelText(openai.nameZh)).toBeNull()

    fireEvent.change(search, { target: { value: tiktok.nameZh } })
    expect(screen.getByLabelText(tiktok.nameZh)).toBeTruthy()

    fireEvent.change(search, { target: { value: 'does-not-exist' } })
    expect(screen.getByText('没有匹配的服务。')).toBeTruthy()
  })

  it('selects and clears only the visible filtered results', () => {
    const tiktok = RULE_PRESETS.find((preset) => preset.id === 'tiktok')!
    render(<Picker />)

    fireEvent.change(screen.getByLabelText('搜索服务'), {
      target: { value: 'TikTok' },
    })
    fireEvent.click(screen.getByRole('button', { name: '全选当前可见结果' }))
    expect(
      (screen.getByLabelText(tiktok.nameZh) as HTMLInputElement).checked,
    ).toBe(true)
    expect(screen.getByText(/已选择 1 项/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '清空当前可见结果' }))
    expect(
      (screen.getByLabelText(tiktok.nameZh) as HTMLInputElement).checked,
    ).toBe(false)
  })

  it('uses native category fieldsets for category selection and retains CGNAT', () => {
    const category = PRESET_CATEGORIES.find(({ id }) => id === 'social')!
    const items = RULE_PRESETS.filter(
      (preset) => preset.category === category.id,
    )
    render(<Picker />)

    const group = screen.getByRole('group', { name: category.nameZh })
    fireEvent.click(within(group).getByRole('button', { name: '全选当前分类' }))
    for (const preset of items)
      expect(
        (screen.getByLabelText(preset.nameZh) as HTMLInputElement).checked,
      ).toBe(true)

    fireEvent.click(screen.getByLabelText(/直连共享地址段（CGNAT）/))
    expect(
      (screen.getByLabelText(/直连共享地址段（CGNAT）/) as HTMLInputElement)
        .checked,
    ).toBe(true)
  })
})
