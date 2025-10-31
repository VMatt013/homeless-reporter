
import type { Handler } from "@netlify/functions";
import sgMail from "@sendgrid/mail";

// Set your SendGrid API key in Netlify environment variables
sgMail.setApiKey(process.env.NETLIFY_EMAILS_PROVIDER_API_KEY as string);

// Read sender/recipient from Netlify environment variables
const FROM_EMAIL = process.env.NETLIFY_EMAILS_FROM;
const TO_EMAIL = process.env.NETLIFY_EMAILS_TO;

const handler: Handler = async function(event) {
  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify("Payload required") };
  }

  let requestBody: {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    photo?: string;
  };

  try {
    requestBody = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify("Invalid JSON payload") };
  }

  const { name, description, latitude, longitude, photo } = requestBody;

  // Validate coordinates
  if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
    return { statusCode: 400, body: JSON.stringify("Latitude and longitude are required") };
  }

  if (!FROM_EMAIL || !TO_EMAIL) {
    return { statusCode: 500, body: JSON.stringify("Sender or recipient email is not set") };
  }

  // Google Maps link
  const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const msg: any = {
    to: TO_EMAIL,
    from: FROM_EMAIL,
    subject: "Új bejelentés érkezett: Hajléktalan helyszín bejelentés",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #0056b3;">Új bejelentés érkezett!</h2>
        <p>Egy új bejelentés érkezett egy hajléktalan személy helyszínéről. Kérjük, azonnal ellenőrizze:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
          <h3 style="margin-top: 0; color: #333;">Bejelentés részletei</h3>
          <p><strong>Bejelentő:</strong> ${name}</p>
          <p><strong>Leírás:</strong></p>
          <p style="white-space: pre-wrap; margin-left: 15px; border-left: 2px solid #ddd; padding-left: 10px; font-style: italic;">${description}</p>
          
          <p><strong>Koordináták:</strong></p>
          <p style="margin-left: 15px;">
            Szélesség: ${latitude}<br>
            Hosszúság: ${longitude}
          </p>
          
          <p style="text-align: center; margin-top: 20px;">
            <a href="${mapLink}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #1f3c88; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Térképen Megnéz
            </a>
          </p>
          ${photo ? `
          <div style="margin-top: 20px;">
            <p style="margin-bottom: 10px;"><strong>Csatolt fénykép:</strong></p>
            <img src="cid:reportImage" alt="Reported photo" style="max-width: 100%; height: auto; border-radius: 8px; display: block;"/>
          </div>
          ` : ""}
        </div>
      </div>
    `,
    attachments: []
  };

  // Attach image if provided
  if (photo) {
    msg.attachments.push({
      content: photo,
      filename: "photo.png",
      type: "image/png",
      disposition: "inline",
      content_id: "reportImage"
    });
  }

  try {
    await sgMail.send(msg);
    return { statusCode: 200, body: JSON.stringify("Report received and email sent!") };
  } catch (err) {
    console.error("SendGrid error:", err);
    return { statusCode: 500, body: JSON.stringify("Failed to send email") };
  }
};

export { handler };

