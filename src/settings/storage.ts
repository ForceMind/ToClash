import { DEFAULT_PRESETS } from '../core/rules/presets'
import type { PresetId } from '../core/rules/types'

/** Only these routing fields are persisted; node credentials never enter storage. */
export interface SavedSettings {
  directInput: string
  proxyInput: string
  intranetEnabled: boolean
  intranetSuffixInput: string
  intranetDnsInput: string
  mode: 'standard' | 'direct'
  presets: Record<PresetId, boolean>
  bypassCgnat: boolean
}

export const SETTINGS_KEY = 'toclash.routing.v1'
export const defaultPresets = DEFAULT_PRESETS

const presetIds = Object.keys(defaultPresets) as PresetId[]

export const emptySettings: SavedSettings = {
  directInput: '',
  proxyInput: '',
  intranetEnabled: false,
  intranetSuffixInput: '',
  intranetDnsInput: '',
  mode: 'standard',
  presets: defaultPresets,
  bypassCgnat: false,
}

const legacyFields = [
  'directInput',
  'proxyInput',
  'intranetEnabled',
  'intranetSuffixInput',
  'intranetDnsInput',
] as const

function cloneDefaults(): SavedSettings {
  return { ...emptySettings, presets: { ...defaultPresets } }
}

function validPresets(value: unknown): value is Record<PresetId, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const presets = value as Record<string, unknown>
  return presetIds.every((id) =>
    presets[id] === undefined
      ? !defaultPresets[id]
      : typeof presets[id] === 'boolean',
  )
}

function copyPresets(
  presets: Record<PresetId, boolean>,
): Record<PresetId, boolean> {
  return Object.fromEntries(
    presetIds.map((id) => [id, presets[id] ?? defaultPresets[id]]),
  ) as Record<PresetId, boolean>
}

function isEmptySettings(settings: SavedSettings): boolean {
  return (
    settings.directInput === '' &&
    settings.proxyInput === '' &&
    settings.intranetEnabled === false &&
    settings.intranetSuffixInput === '' &&
    settings.intranetDnsInput === '' &&
    settings.mode === 'standard' &&
    settings.bypassCgnat === false &&
    presetIds.every((id) => settings.presets[id] === defaultPresets[id])
  )
}

export function loadSettings(): { settings: SavedSettings; failed: boolean } {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (raw === null) return { settings: cloneDefaults(), failed: false }
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') throw new Error('Invalid settings')
    const value = data as Record<string, unknown>
    if (value.version !== 1) throw new Error('Unsupported settings')
    for (const key of legacyFields) {
      if (typeof value[key] !== typeof emptySettings[key])
        throw new Error('Invalid field')
    }
    // Version 1 initially contained only the five fields above. Missing new
    // fields therefore mean a valid legacy value and receive safe defaults.
    if (
      value.mode !== undefined &&
      value.mode !== 'standard' &&
      value.mode !== 'direct'
    )
      throw new Error('Invalid mode')
    if (value.presets !== undefined && !validPresets(value.presets))
      throw new Error('Invalid presets')
    if (
      value.bypassCgnat !== undefined &&
      typeof value.bypassCgnat !== 'boolean'
    )
      throw new Error('Invalid bypassCgnat')
    return {
      settings: {
        directInput: value.directInput as string,
        proxyInput: value.proxyInput as string,
        intranetEnabled: value.intranetEnabled as boolean,
        intranetSuffixInput: value.intranetSuffixInput as string,
        intranetDnsInput: value.intranetDnsInput as string,
        mode: (value.mode as SavedSettings['mode'] | undefined) ?? 'standard',
        presets:
          value.presets === undefined
            ? { ...defaultPresets }
            : copyPresets(value.presets as Record<PresetId, boolean>),
        bypassCgnat: (value.bypassCgnat as boolean | undefined) ?? false,
      },
      failed: false,
    }
  } catch {
    return { settings: cloneDefaults(), failed: true }
  }
}

export function saveSettings(settings: SavedSettings): boolean {
  try {
    if (isEmptySettings(settings)) {
      window.localStorage.removeItem(SETTINGS_KEY)
    } else {
      window.localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          version: 1,
          directInput: settings.directInput,
          proxyInput: settings.proxyInput,
          intranetEnabled: settings.intranetEnabled,
          intranetSuffixInput: settings.intranetSuffixInput,
          intranetDnsInput: settings.intranetDnsInput,
          mode: settings.mode,
          presets: copyPresets(settings.presets),
          bypassCgnat: settings.bypassCgnat,
        }),
      )
    }
    return true
  } catch {
    return false
  }
}
