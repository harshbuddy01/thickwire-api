const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: 'a971a9001@smtp-brevo.com',
    pass: 'sMYSFpvKtVh2BI71',
  },
});

transporter.sendMail({
  from: 'support@streamkart.store',
  to: 'a971a9001@smtp-brevo.com', // sending to self just to test
  subject: 'Test Email',
  text: 'This is a test email.',
}, (err, info) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Success:', info);
  }
});
