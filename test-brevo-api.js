const axios = require('axios');

async function testBrevoApi() {
  try {
    const res = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: 'support@streamkart.store' },
      to: [{ email: 'harshbuddy01@gmail.com' }],
      subject: 'Test API',
      textContent: 'Test API'
    }, {
      headers: {
        'api-key': 'sMYSFpvKtVh2BI71',
        'Content-Type': 'application/json'
      }
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.log('Error:', err.response?.data || err.message);
  }
}

testBrevoApi();
