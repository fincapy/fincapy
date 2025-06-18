'use client';

import { useEffect } from 'react';

export default function TermsOfServicePage({ nonce }) {
  useEffect(() => {
    const scriptId = 'termly-script';

    // Remove existing script if it exists
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Re-add the script
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://app.termly.io/embed-policy.min.js'; // Replace with the actual URL
    script.async = true;
    script.nonce = nonce;
    document.body.appendChild(script);

    return () => {
      // Clean up when unmounting
      script.remove();
    };
  }, [nonce]);

  return (
    <div
      name="termly-embed"
      data-id="aa41ec73-64aa-4e13-95bd-2098f1fa6048"
      data-type="iframe"
    ></div>
  );
}
