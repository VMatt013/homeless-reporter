
const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  try {
    const data = JSON.parse(event.body || '{}');
    const { SENDGRID_API_KEY, REPORT_TO, REPORT_FROM } = process.env;

    if (!SENDGRID_API_KEY || !REPORT_TO || !REPORT_FROM) {
      console.error('Missing email environment variables');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Email config missing' }) };
    }

    sgMail.setApiKey(SENDGRID_API_KEY);

    const { name, description, latitude, longitude, photo } = data;
    const subject = `Új bejelentés: ${name || 'Névtelen'}`;
    const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    const html = `
      <h2>Új bejelentés érkezett</h2>
      <p><b>Név:</b> ${name || 'N/A'}</p>
      <p><b>Leírás:</b><br>${(description || '').replace(/\n/g, '<br>')}</p>
      <p><b>Hely:</b> ${latitude}, ${longitude} — <a href="${mapLink}" target="_blank">Megnyitás térképen</a></p>
      ${photo ? `<p><img src="data:image/*;base64,${photo}" style="max-width:480px;border-radius:8px"/></p>` : ''}
    `;

    const msg = {
      to: REPORT_TO,
      from: REPORT_FROM,
      subject,
      html,
    };

    await sgMail.send(msg);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, message: 'Email sent successfully' }),
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Email send failed' }),
    };
  }
};

