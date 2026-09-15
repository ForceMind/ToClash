export const BEGINNER_GUIDE_KEY = 'toclash.beginner-guide.v1'

export function shouldOpenBeginnerGuide(): boolean {
  try {
    return window.localStorage.getItem(BEGINNER_GUIDE_KEY) !== 'seen'
  } catch {
    return true
  }
}

export function markBeginnerGuideSeen(): boolean {
  try {
    window.localStorage.setItem(BEGINNER_GUIDE_KEY, 'seen')
    return true
  } catch {
    return false
  }
}
