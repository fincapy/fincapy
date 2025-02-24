export async function checkRateLimit({
  rateLimiter,
  key,
  limit = 10,
  windowInSeconds = 60,
  backoffThreshold = 10
}) {
  const isLimited = await rateLimiter.isRateLimited({
    key,
    limit,
    windowInSeconds,
    backoffThreshold
  });

  if (isLimited) {
    const attempts = await rateLimiter.getAttempts(key);
    
    if (attempts <= backoffThreshold) {
      throw new Error(`Too many attempts. Please try again in 1 minute.`);
    } else {
      const attemptsOverThreshold = attempts - backoffThreshold;
      const backoffMinutes = Math.min(
        Math.pow(2, Math.floor(attemptsOverThreshold / limit)),
        1440 // Max 24 hours
      );
      throw new Error(`Too many attempts. Please try again in ${backoffMinutes} minutes.`);
    }
  }
}
