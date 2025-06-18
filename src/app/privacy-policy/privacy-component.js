'use client';

import { useEffect } from 'react';

export default function PrivacyPolicyPage({ nonce }) {
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
      data-id="adce23a1-078c-4dbf-9aeb-6df13709080d"
      data-type="iframe"
    ></div>
  );
}
