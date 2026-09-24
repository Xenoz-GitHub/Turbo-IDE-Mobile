/**
 * Dedicated Haptic Service Layer for Turbo C++ Mobile
 * Triggers nuanced device vibrations matched to key importance
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

export type KeyImportance = 'primary' | 'modifier' | 'action' | 'navigation' | 'standard';

class HapticService {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Triggers device vibration pattern according to key importance
   */
  public trigger(importance: KeyImportance = 'standard') {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        switch (importance) {
          case 'action':
            // Firmer double pulse for Run, Compile, Break
            navigator.vibrate([35, 25, 25]);
            break;
          case 'modifier':
            // Solid firm pulse for Alt, Ctrl, Shift, Sticky toggles
            navigator.vibrate(30);
            break;
          case 'primary':
            // Crisp firm feedback for F1-F10 function keys and Enter
            navigator.vibrate(22);
            break;
          case 'navigation':
            // Medium feedback for Esc, Tab, Arrows, Backspace, Del
            navigator.vibrate(15);
            break;
          case 'standard':
          default:
            // Subtle, light haptic for standard characters, digits, and symbols
            navigator.vibrate(8);
            break;
        }
      }
    } catch {
      // Haptics unsupported or blocked by browser user gesture policy
    }
  }

  /**
   * Helper that determines importance from key string
   */
  public triggerForKey(key: string, isSpecial: boolean = false) {
    if (['Run', 'Compile', 'Break', 'ctrl-f9', 'alt-f9', 'break'].includes(key)) {
      this.trigger('action');
    } else if (['ctrl', 'alt', 'shift', 'Ctrl', 'Alt', 'Shift', 'fn', 'Fn'].includes(key)) {
      this.trigger('modifier');
    } else if (key.startsWith('F') && key.length <= 3) {
      this.trigger('primary');
    } else if (['Enter', 'Return', 'RET'].includes(key)) {
      this.trigger('primary');
    } else if (['Escape', 'Esc', 'ESC', 'Tab', 'TAB', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PgUp', 'PgDn', 'Ins', 'Del'].includes(key)) {
      this.trigger('navigation');
    } else {
      this.trigger('standard');
    }
  }
}

export const hapticService = new HapticService();
