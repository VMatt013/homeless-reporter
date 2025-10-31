
// netlify/functions/send-report.js
const headersBase = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headersBase };
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers: headersBase, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: headersBase, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  // From/To (works with either REPORT_* or NETLIFY_EMAILS_* you already had)
  const FROM = process.env.REPORT_FROM || process.env.NETLIFY_EMAILS_FROM || '';
  const TO   = process.env.REPORT_TO   || process.env.NETLIFY_EMAILS_TO   || '';
  if (!FROM || !TO) {
    return { statusCode: 500, headers: headersBase, body: JSON.stringify({ error: 'Missing REPORT_FROM/REPORT_TO (or NETLIFY_EMAILS_FROM/TO)' }) };
  }

  const { name, description, latitude, longitude, photo } = data;
  const subject = `Új bejelentés: ${name || 'Névtelen'}`;
  const mapLink = (latitude && longitude) ? `https://www.google.com/maps?q=${latitude},${longitude}` : '';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif">
      <h2 style="color:#9d1b31;margin:0 0 12px">Új bejelentés</h2>
      <p><b>Név:</b> ${name || 'N/A'}</p>
      <p><b>Leírás:</b><br>${(description || '').replace(/\n/g,'<br>')}</p>
      ${mapLink ? `<p><b>Hely:</b> ${latitude}, ${longitude} — <a href="${mapLink}" target="_blank">Megnyitás térképen</a></p>` : ''}
      ${photo ? `<p><img src="data:image/*;base64,${photo}" style="max-width:520px;border-radius:8px"/></p>` : ''}
    </div>
  `;

  // Pick provider
  const provider = (process.env.MAIL_PROVIDER || process.env.NETLIFY_EMAILS_PROVIDER || 'sendgrid').toLowerCase();

  try {
    if (provider === 'resend') {
      const key = process.env.RESEND_API_KEY;
      if (!key) throw new Error('RESEND_API_KEY missing');
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: TO, subject, html })
      });
      if (!res.ok) {
        const text = await res.text().catch(()=> '');
        return { statusCode: 500, headers: headersBase, body: JSON.stringify({ error: 'Resend error', status: res.status, detail: text }) };
      }
      return { statusCode: 200, headers: headersBase, body: JSON.stringify({ ok: true }) };
    }

    // default: SendGrid (works with either SENDGRID_API_KEY or NETLIFY_EMAILS_PROVIDER_API_KEY when provider=sendgrid)
    const sgKey = process.env.SENDGRID_API_KEY ||
                  (process.env.NETLIFY_EMAILS_PROVIDER === 'sendgrid' && process.env.NETLIFY_EMAILS_PROVIDER_API_KEY) || '';
    if (!sgKey) throw new Error('No SendGrid key found');

    const sg = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: TO }] }],
        from: { email: FROM },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (!sg.ok) {
      const text = await sg.text().catch(()=> '');
      return { statusCode: 500, headers: headersBase, body: JSON.stringify({ error: 'SendGrid error', status: sg.status, detail: text }) };
    }
    return { statusCode: 200, headers: headersBase, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, headers: headersBase, body: JSON.stringify({ error: 'Provider call failed', detail: String(err) }) };
  }
};

