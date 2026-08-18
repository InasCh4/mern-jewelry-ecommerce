const nodemailer = require("nodemailer");
const validator = require("validator");

const hasSmtpConfig = () => {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || !validator.isEmail(to)) {
    throw new Error("Invalid email recipient.");
  }

  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP configuration is missing.");
    }

    console.log("\n================ ECLORA DEV EMAIL ================");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:", text);
    console.log("==================================================\n");

    return {
      skipped: true,
      reason: "SMTP not configured in development.",
    };
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"ECLORA" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });

  return {
    sent: true,
  };
};

module.exports = {
  sendEmail,
};
