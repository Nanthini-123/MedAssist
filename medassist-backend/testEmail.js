import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testEmail() {
    try {
        await sgMail.send({
            to: "nanthini19052005@gmail.com",
            from: "medassist.ai1@gmail.com",   // ✅ Verified sender
            subject: "Test Email from MedAssist AI",
            text: "This is a test email to check SendGrid integration.",
            html: "<p>This is a test email to check <b>SendGrid</b> integration.</p>"
        });
        console.log("Test email sent!");
    } catch (err) {
        console.error("Error sending test email:", err.response?.body || err.message);
    }
}

testEmail();