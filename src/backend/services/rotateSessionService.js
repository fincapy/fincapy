class RotateSessionService {
  constructor({ sessionRepository }) {
    this.sessionRepository = sessionRepository;
  }

  async execute({ newSessionId, existingSessionId }) {
    const session = await this.sessionRepository.get({ sessionId });
    if (session === null) {
      return false;
    }
    await this.sessionRepository.delete({ sessionId: existingSessionId });
    await this.sessionRepository.set({ sessionId: newSessionId, userId });
    return true;
  }
}
