// eslint-disable-next-line import/prefer-default-export
export const mailTemplateService = {
  getTemplate(type, name) {
    switch (type) {
      case 'signUpTemplate':
        return `
          <h2>Welcome ${name}</h2>
          <p>Thank you for joining hapmeet ❤️</p>
        `;

      case 'offerTemplate':
        return `
          <h2>Hello ${name}</h2>
          <p>New Discounts Available 🔥 Hurry Up!</p>
        `;

      case 'reminderTemplate':
        return `
          <h2>Hi ${name}</h2>
          <p>This is a gentle reminder for your pending actions.</p>
        `;

      default:
        return `<p>Hello ${name}</p>`;
    }
  },
};
