'use client';
import { useEffect, useState } from 'react';

// function logToScreen(message) {
//   const el = document.createElement('div');
//   el.textContent = message;
//   el.style.position = 'fixed';
//   el.style.top = '0';
//   el.style.left = '0';
//   el.style.backgroundColor = 'rgba(0,0,0,0.7)';
//   el.style.color = 'white';
//   el.style.padding = '10px';
//   el.style.zIndex = '9999';
//   document.body.appendChild(el);
// }

export function useStandalone() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
  }, []);

  return isStandalone;
}
