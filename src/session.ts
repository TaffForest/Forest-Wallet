// runtime-only password for the current popup session
let _pwd: string | null = null;
let _lastActivity: number = Date.now();
let _lockTimeout: NodeJS.Timeout | null = null;
let _onLock: (() => void) | null = null;

const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export const setRuntimePassword = (p: string) => { 
  _pwd = p; 
  resetLockTimer();
};

export const getRuntimePassword = () => {
  if (_pwd) {
    updateActivity();
    return _pwd;
  }
  return null;
};

export const clearRuntimePassword = () => { 
  _pwd = null; 
  clearLockTimer();
};

export const setOnLock = (callback: () => void) => {
  _onLock = callback;
};

export const updateActivity = () => {
  _lastActivity = Date.now();
  resetLockTimer();
};

export const resetLockTimer = () => {
  clearLockTimer();
  _lockTimeout = setTimeout(() => {
    console.log('Auto-locking wallet due to inactivity');
    _pwd = null;
    if (_onLock) {
      _onLock();
    }
  }, LOCK_TIMEOUT_MS);
};

export const clearLockTimer = () => {
  if (_lockTimeout) {
    clearTimeout(_lockTimeout);
    _lockTimeout = null;
  }
};

export const getTimeUntilLock = (): number => {
  if (!_pwd) return 0;
  const timeElapsed = Date.now() - _lastActivity;
  const timeRemaining = LOCK_TIMEOUT_MS - timeElapsed;
  return Math.max(0, timeRemaining);
};

