'use client';

export function useStandalone() {
  if (typeof window !== 'undefined') {
    return window.navigator.standalone || 
           window.matchMedia('(display-mode: standalone)').matches;
  }
  return false;
}
