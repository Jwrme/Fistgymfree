// Reusable HTML email builder for welcome emails
function buildWelcomeEmail({ firstname, lastname, brand = {} }) {
  const BRAND = {
    name: brand.brandName || process.env.EMAIL_BRAND_NAME || 'FIST GYM',
    logoUrl:
      brand.logoUrl ||
      process.env.EMAIL_BRAND_LOGO_URL ||
      'https://fistgym.com.ph/wp-content/uploads/2023/11/fistgym_logo.png',
    address:
      brand.address ||
      process.env.EMAIL_BRAND_ADDRESS ||
      'Suite 301, Gil-Preciosa Bldg. 2, 75 Timog Avenue, Quezon City, Philippines'
  };

  const fullName = `${firstname} ${lastname}`;
  const subject = `Welcome to ${BRAND.name}!`;
  const text = `Welcome to ${BRAND.name}!\n\nHi ${fullName},\n\nWelcome to the ${BRAND.name} family! Your account has been successfully created and verified.\n\nYou can now:\n- Book training sessions with our expert coaches\n- Access your personalized dashboard\n- Track your fitness journey\n- View class schedules and availability\n\nWe're excited to help you achieve your fitness goals!\n\nBest regards,\nThe ${BRAND.name} Team\n\n${BRAND.address}`;

  const html = `
  <div style="background:#f4f6f8;padding:32px 0;min-height:100vh;">
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;box-shadow:0 2px 16px rgba(0,0,0,0.07);overflow:hidden;">
      <div style="padding:24px 0;text-align:center;background:#ffffff;">
        <img src="${BRAND.logoUrl}" alt="${BRAND.name}" style="height:48px;object-fit:contain;max-width:90%;" />
      </div>
      <div style="padding:36px 32px 32px 32px;">
        <h1 style="font-size:28px;color:#2ecc40;margin:0 0 16px 0;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center;">
          Welcome to ${BRAND.name}!
        </h1>
        <h2 style="font-size:20px;color:#181818;margin:0 0 24px 0;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          Hi ${fullName},
        </h2>
        <p style="color:#444;margin:0 0 20px 0;font-size:16px;line-height:1.6;">
          Welcome to the ${BRAND.name} family! Your account has been successfully created and verified.
        </p>
        <div style="background:#f8f9fa;padding:24px;border-radius:8px;margin:24px 0;border-left:4px solid #2ecc40;">
          <h3 style="color:#2ecc40;margin:0 0 16px 0;font-size:18px;">You can now:</h3>
          <ul style="color:#444;margin:0;padding-left:20px;line-height:1.8;">
            <li>Book training sessions with our expert coaches</li>
            <li>Access your personalized dashboard</li>
            <li>Track your fitness journey</li>
            <li>View class schedules and availability</li>
          </ul>
        </div>
        <p style="color:#444;margin:24px 0 0 0;font-size:16px;line-height:1.6;">
          We're excited to help you achieve your fitness goals!
        </p>
        <p style="color:#444;margin:16px 0 0 0;font-size:16px;font-weight:600;">
          Best regards,<br>
          The ${BRAND.name} Team
        </p>
      </div>
      <div style="padding:14px 18px;text-align:center;background:#fafafa;border-top:1px solid #eee;color:#6b7280;font-size:12px;">
        ${BRAND.address}
      </div>
    </div>
  </div>
  `;

  return { subject, html, text };
}

// Reusable HTML email builder for verification codes
function buildVerificationEmail({ code, purpose = 'Verification', expiresMinutes = 3, brand = {} }) {
  const BRAND = {
    name: brand.brandName || process.env.EMAIL_BRAND_NAME || 'SenJitsu',
    logoUrl:
      brand.logoUrl ||
      process.env.EMAIL_BRAND_LOGO_URL ||
      'http://localhost:3001/logo512.png',
    address:
      brand.address ||
      process.env.EMAIL_BRAND_ADDRESS ||
      'Suite 301, Gil-Preciosa Bldg. 2, 75 Timog Avenue, Quezon City, Philippines'
  };

  const subject = `${BRAND.name} ${purpose}`;
  const text = `${BRAND.name} ${purpose}\n\nYour one-time verification code: ${code}\nThis code expires in ${expiresMinutes} minute(s).\n\n${BRAND.address}`;

  const html = `
  <div style="background:#f4f6f8;padding:32px 0;min-height:100vh;">
    <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:8px;box-shadow:0 2px 16px rgba(0,0,0,0.07);overflow:hidden;">
      <div style="padding:24px 0;text-align:center;background:#ffffff;">
        <img src="${BRAND.logoUrl}" alt="${BRAND.name}" style="height:48px;object-fit:contain;max-width:90%;" />
      </div>
      <div style="padding:36px 32px 32px 32px;text-align:center;">
        <h2 style="font-size:20px;color:#181818;margin:0 0 8px 0;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          Your one-time verification code
        </h2>
        <div style="margin:14px 0 18px 0;font-size:34px;font-weight:800;letter-spacing:3px;color:#2ecc40;font-family:ui-monospace,Consolas,Monaco,monospace;">
          ${code}
        </div>
        <p style="color:#444;margin:0 0 16px 0;font-size:14px;">This code expires in ${expiresMinutes} minute(s).</p>
        <p style="color:#6b7280;margin:0;font-size:12px;">If you didn’t request this, you can safely ignore this email.</p>
      </div>
      <div style="padding:14px 18px;text-align:center;background:#fafafa;border-top:1px solid #eee;color:#6b7280;font-size:12px;">
        ${BRAND.address}
      </div>
    </div>
  </div>
  `;

  return { subject, html, text };
}

module.exports = { buildVerificationEmail, buildWelcomeEmail };

