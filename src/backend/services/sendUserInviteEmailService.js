import jwt from 'jsonwebtoken';

class SendUserInviteEmailService {
  constructor({ sesAdapter }) {
    this.sesAdapter = sesAdapter;
  }

  async execute({ email, userId, inviterName }) {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });
    const inviteUrl = `${process.env.SITE_URL}/join?token=${token}`;
    if (process.env.NODE_ENV === 'production') {
      await this.sesAdapter.sendEmail({
        to: email,
        subject: 'Welcome to Fincapy!',
        text: `You have been invited to join Fincapy by ${inviterName}.\n\nPlease click the link below to accept the invitation:\n${inviteUrl}`,
      });
    } else {
      console.log('inviteUrl', inviteUrl);
    }
  }
}

export { SendUserInviteEmailService };
