import { beforeEach, describe, expect, it } from 'vitest'
import {
  defaultPresets,
  emptySettings,
  loadSettings,
  saveSettings,
  SETTINGS_KEY,
} from '../src/settings/storage'

const legacy = {
  version: 1,
  directInput: 'direct.example',
  proxyInput: 'proxy.example',
  intranetEnabled: true,
  intranetSuffixInput: 'corp.example',
  intranetDnsInput: '192.0.2.53',
}

describe('routing settings storage', () => {
  beforeEach(() => window.localStorage.clear())

  it('migrates valid version 1 settings to safe defaults for new fields', () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(legacy))

    expect(loadSettings()).toEqual({
      failed: false,
      settings: {
        ...emptySettings,
        directInput: legacy.directInput,
        proxyInput: legacy.proxyInput,
        intranetEnabled: legacy.intranetEnabled,
        intranetSuffixInput: legacy.intranetSuffixInput,
        intranetDnsInput: legacy.intranetDnsInput,
        presets: defaultPresets,
      },
    })
  })

  it('round-trips the direct mode, service presets, and CGNAT option', () => {
    const settings = {
      ...emptySettings,
      mode: 'direct' as const,
      presets: {
        ...defaultPresets,
        openai: true,
        claude: false,
        developer: false,
        google: true,
        x: true,
        tiktok: true,
      },
      bypassCgnat: true,
    }

    expect(saveSettings(settings)).toBe(true)
    expect(loadSettings()).toEqual({ settings, failed: false })
  })

  it('preserves v0.3.2 service choices and leaves additions disabled', () => {
    const oldPresets = {
      openai: false,
      claude: true,
      developer: false,
      google: true,
    }
    const raw = JSON.stringify({
      ...legacy,
      mode: 'direct',
      presets: oldPresets,
    })
    window.localStorage.setItem(SETTINGS_KEY, raw)
    const loaded = loadSettings()
    expect(loaded.failed).toBe(false)
    expect(loaded.settings.mode).toBe('direct')
    expect(loaded.settings.presets).toEqual({
      ...defaultPresets,
      ...oldPresets,
    })
    expect(loaded.settings.presets.x).toBe(false)
    expect(loaded.settings.presets.tiktok).toBe(false)
    expect(window.localStorage.getItem(SETTINGS_KEY)).toBe(raw)
  })

  it('removes a semantically default settings object with cloned presets', () => {
    expect(
      saveSettings({ ...emptySettings, presets: { ...defaultPresets } }),
    ).toBe(true)
    expect(window.localStorage.getItem(SETTINGS_KEY)).toBeNull()
  })

  it('keeps unknown fields compatible but rejects malformed known new fields', () => {
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        ...legacy,
        futureField: 'retained',
        mode: 'standard',
        presets: { ...defaultPresets, futureService: true },
      }),
    )
    expect(loadSettings()).toEqual({
      failed: false,
      settings: {
        ...emptySettings,
        directInput: legacy.directInput,
        proxyInput: legacy.proxyInput,
        intranetEnabled: legacy.intranetEnabled,
        intranetSuffixInput: legacy.intranetSuffixInput,
        intranetDnsInput: legacy.intranetDnsInput,
        presets: defaultPresets,
      },
    })

    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        ...legacy,
        presets: { ...defaultPresets, google: 'yes' },
      }),
    )
    expect(loadSettings()).toEqual({ settings: emptySettings, failed: true })
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        ...legacy,
        presets: { ...defaultPresets, tiktok: 'true' },
      }),
    )
    expect(loadSettings().failed).toBe(true)
  })
})
