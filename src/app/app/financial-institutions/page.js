'use client';

import { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { fetchLinkToken, exchangePublicToken } from './serverActions';

export default function Home() {
  const [linkToken, setLinkToken] = useState(null);

  useEffect(() => {
    const linkTokenFlow = async () => {
      const linkToken = await fetchLinkToken();
      setLinkToken(linkToken);
    };
    linkTokenFlow();
  }, []);

  const onSuccess = async (public_token, metadata) => {
    await exchangePublicToken({
      publicToken: public_token,
      institutionId: metadata.institution.institution_id,
      institutionName: metadata.institution.name,
    });
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return (
    <div>
      <h1>Plaid Link Integration</h1>
      <button onClick={() => open()} disabled={!ready}>
        Connect a bank account
      </button>
    </div>
  );
}
