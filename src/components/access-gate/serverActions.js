'use server';

const verifyAccessCode = async (accessCode) => {
  if (accessCode !== process.env.NEXT_PUBLIC_SITE_ACCESS_CODE) {
    return false;
  }
  return true;
};

export { verifyAccessCode };
