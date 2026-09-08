/** Only these routing fields are persisted; node credentials never enter storage. */
export interface SavedSettings {
  directInput: string
  proxyInput: string
  intranetEnabled: boolean
  intranetSuffixInput: string
  intranetDnsInput: string
}

export const SETTINGS_KEY = 'toclash.routing.v1'
export const emptySettings: SavedSettings = {
  directInput: '',
  proxyInput: '',
  intranetEnabled: false,
  intranetSuffixInput: '',
  intranetDnsInput: '',
}

export function loadSettings(): { settings: SavedSettings; failed: boolean } {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (raw === null) return { settings: emptySettings, failed: false }
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') throw new Error('Invalid settings')
    const value = data as Record<string, unknown>
    if (value.version !== 1) throw new Error('Unsupported settings')
    for (const key of Object.keys(emptySettings) as (keyof SavedSettings)[]) {
      if (typeof value[key] !== typeof emptySettings[key])
        throw new Error('Invalid field')
    }
    return {
      settings: {
        directInput: value.directInput as string,
        proxyInput: value.proxyInput as string,
        intranetEnabled: value.intranetEnabled as boolean,
        intranetSuffixInput: value.intranetSuffixInput as string,
        intranetDnsInput: value.intranetDnsInput as string,
      },
      failed: false,
    }
  } catch {
    return { settings: emptySettings, failed: true }
  }
}

export function saveSettings(settings: SavedSettings): boolean {
  try {
    if (
      Object.entries(emptySettings).every(
        ([key, value]) => settings[key as keyof SavedSettings] === value,
      )
    ) {
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
        }),
      )
    }
    return true
  } catch {
    return false
  }
}
