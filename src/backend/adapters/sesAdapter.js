import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

class SESAdapter {
  constructor() {
    this.client = new SESClient({
      region: 'us-east-1', // or your preferred region
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendEmail({ to, subject, text }) {
    const params = {
      Source: 'support@fincapy.com', // Replace with your verified SES sender
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Text: {
            Data: text,
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}

export { SESAdapter };
