
const sgMail = require('@sendgrid/mail');


exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  try {
    const data = JSON.parse(event.body || '{}');

    // ✅ Use Netlify Emails API
    const response = await fetch('https://api.netlify.com/api/v1/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NETLIFY_EMAILS_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.NETLIFY_EMAILS_FROM,
        to: process.env.NETLIFY_EMAILS_TO,
        subject: `Új bejelentés érkezett: ${data.name || 'Névtelen'}`,
        parameters: {
          name: data.name || 'N/A',
          description: data.description || '',
          location: `${data.latitude}, ${data.longitude}`,
          mapLink: `https://www.google.com/maps?q=${data.latitude},${data.longitude}`,
        },
        // Optional: you can include a simple HTML body
        html: `
          <h2>Új bejelentés</h2>
          <p><b>Név:</b> ${data.name || 'N/A'}</p>
          <p><b>Leírás:</b><br>${data.description || ''}</p>
          <p><b>Hely:</b> ${data.latitude}, ${data.longitude}</p>
          <p><a href="https://www.google.com/maps?q=${data.latitude},${data.longitude}" target="_blank">Térképen megnyitás</a></p>
        `
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Netlify Email error:', text);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send email' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, message: 'Email sent successfully (via Netlify Emails)' }),
    };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Unexpected error' }) };
  }
};

