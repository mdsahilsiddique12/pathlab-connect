const https = require('https');
const nodemailer = require('nodemailer');

// WhatsApp Business API Function
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    
    if (!whatsappToken || !phoneId) {
      console.log('❌ WhatsApp credentials missing in .env');
      return false;
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\+/g, '').replace(/\s/g, '');
    
    const postData = JSON.stringify({
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    });

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v18.0/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('WhatsApp API Response Status:', res.statusCode);
          
          if (res.statusCode === 200) {
            console.log('✅ WhatsApp message sent successfully');
            resolve(true);
          } else {
            console.log('❌ WhatsApp API Error:', res.statusCode, data);
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.log('❌ WhatsApp request error:', error.message);
        resolve(false);
      });

      req.write(postData);
      req.end();
    });

  } catch (error) {
    console.log('❌ WhatsApp send error:', error.message);
    return false;
  }
}

// 📧 REAL Email Sending Function
async function sendEmail(recipientEmail, customerName, messageData, isAdmin = false) {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('❌ Email credentials missing in .env file');
      console.log('Required: SMTP_HOST, SMTP_USER, SMTP_PASS');
      return false;
    }

    console.log('📧 Setting up email transporter...');
    
    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (verifyError) {
      console.log('❌ SMTP verification failed:', verifyError.message);
      return false;
    }

    // Different email content for admin vs patient
    let subject, htmlContent, textContent;
    
    if (isAdmin) {
      // ADMIN EMAIL
      subject = `🔔 New Lab Appointment - ${messageData.bookingId}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px; }
                .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .details { background: white; padding: 15px; border-left: 4px solid #dc3545; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 NEW APPOINTMENT ALERT</h1>
                    <h2>PathLab Connect</h2>
                </div>
                
                <div class="content">
                    <h3>📋 New Booking Details:</h3>
                    <div class="details">
                        <p><strong>🆔 Booking ID:</strong> ${messageData.bookingId}</p>
                        <p><strong>👤 Customer:</strong> ${customerName}</p>
                        <p><strong>📱 Phone:</strong> ${messageData.customerPhone}</p>
                        <p><strong>📧 Email:</strong> ${recipientEmail}</p>
                        <p><strong>🧪 Tests:</strong> ${messageData.selectedTests}</p>
                        <p><strong>📅 Collection Date:</strong> ${messageData.collectionDate}</p>
                        <p><strong>⏰ Time Slot:</strong> ${messageData.timeSlot}</p>
                        <p><strong>📍 Address:</strong> ${messageData.address}</p>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4>⚠️ ACTION REQUIRED:</h4>
                        <p>• Assign technician within 2 hours</p>
                        <p>• Contact customer to confirm timing</p>
                        <p>• Prepare test equipment</p>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #666;">
                    <p><strong>PathLab Connect Admin Panel</strong></p>
                    <p>📞 +91 7979 806 128 | 📧 uniquepathlab05@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
      `;
      
      textContent = `NEW LAB APPOINTMENT ALERT

📋 Booking ID: ${messageData.bookingId}
👤 Customer: ${customerName}
📱 Phone: ${messageData.customerPhone}
🧪 Tests: ${messageData.selectedTests}
📅 Date: ${messageData.collectionDate}
⏰ Time: ${messageData.timeSlot}
📍 Address: ${messageData.address}

⚠️ ACTION REQUIRED: Assign technician within 2 hours

PathLab Connect Admin
📞 +91 7979 806 128`;
      
    } else {
      // PATIENT EMAIL
      subject = `✅ Lab Appointment Confirmed - Booking ID: ${messageData.bookingId}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; }
                .details-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
                .next-steps { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .footer { background: #f1f1f1; padding: 20px; text-align: center; color: #666; }
                .contact-info { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔬 PathLab Connect</h1>
                    <h2>Appointment Confirmation</h2>
                </div>
                
                <div class="content">
                    <p>Dear <strong>${customerName}</strong>,</p>
                    
                    <p>Your lab test appointment has been <strong style="color: #28a745;">successfully confirmed</strong>! We're excited to serve you with our professional laboratory services.</p>
                    
                    <div class="details-box">
                        <h3>📋 Your Appointment Details</h3>
                        <p><strong>🆔 Booking ID:</strong> ${messageData.bookingId}</p>
                        <p><strong>🧪 Tests:</strong> ${messageData.selectedTests}</p>
                        <p><strong>📅 Collection Date:</strong> ${messageData.collectionDate}</p>
                        <p><strong>⏰ Time Window:</strong> ${messageData.timeSlot}</p>
                        <p><strong>📍 Address:</strong> ${messageData.address}</p>
                    </div>
                    
                    <div class="next-steps">
                        <h3>📞 What Happens Next?</h3>
                        <ul>
                            <li><strong>Confirmation:</strong> Your booking is confirmed and logged in our system</li>
                            <li><strong>Technician Assignment:</strong> We'll send technician contact details within 2 hours</li>
                            <li><strong>Home Visit:</strong> Our certified technician will visit your address at the scheduled time</li>
                            <li><strong>Sample Collection:</strong> Professional sample collection at your convenience</li>
                            <li><strong>Results:</strong> Test results will be ready within 24-48 hours</li>
                            <li><strong>Report Delivery:</strong> Digital reports sent via email and WhatsApp</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h3>⚠️ Important Preparation Guidelines</h3>
                        <p>• For fasting tests: Please fast for 8-12 hours before collection<br>
                        • Stay hydrated with water<br>
                        • Keep your ID ready for verification<br>
                        • Ensure someone is available at the collection address</p>
                    </div>
                    
                    <p>If you have any questions or need to reschedule, please contact us immediately.</p>
                </div>
                
                <div class="footer">
                    <h3>🏥 PathLab Connect</h3>
                    <p><strong>📞 Phone:</strong> <a href="tel:+917979806128">+91 7979 806 128</a></p>
                    <p><strong>📧 Email:</strong> <a href="mailto:uniquepathlab05@gmail.com">uniquepathlab05@gmail.com</a></p>
                    <p><strong>🌐 Professional Laboratory Services</strong></p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999;">
                        This is an automated confirmation email. Please do not reply directly to this email.<br>
                        For any queries, please contact us at the phone number or email address above.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;

      textContent = `Dear ${customerName},

Your lab test appointment has been SUCCESSFULLY CONFIRMED! ✅

📋 APPOINTMENT DETAILS:
🆔 Booking ID: ${messageData.bookingId}
🧪 Tests: ${messageData.selectedTests}
📅 Collection Date: ${messageData.collectionDate}
⏰ Time Window: ${messageData.timeSlot}
📍 Address: ${messageData.address}

📞 WHAT HAPPENS NEXT:
✅ Your booking is confirmed and logged in our system
📱 We'll send technician contact details within 2 hours  
🏠 Our certified technician will visit your address at the scheduled time
📊 Test results will be ready within 24-48 hours
📧 Digital reports sent via email and WhatsApp

⚠️ IMPORTANT PREPARATION:
• For fasting tests: Please fast for 8-12 hours before collection
• Stay hydrated with water
• Keep your ID ready for verification
• Ensure someone is available at the collection address

📞 CONTACT US:
Phone: +91 7979 806 128
Email: uniquepathlab05@gmail.com

Thank you for choosing PathLab Connect!

Best regards,
PathLab Connect Team

---
This is an automated confirmation email.
For queries, contact us at +91 7979 806 128`;
    }

    // Email options
    const mailOptions = {
      from: `"PathLab Connect" <${smtpUser}>`, // 🏷️ PathLab Connect as sender name
      to: recipientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    console.log(`📧 Sending ${isAdmin ? 'admin' : 'patient'} email to:`, recipientEmail);
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📨 Email sent to:', recipientEmail);
    
    return true;

  } catch (error) {
    console.error('❌ Email send error:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.log('💡 Email authentication failed. Check SMTP_USER and SMTP_PASS in .env');
    } else if (error.code === 'ECONNECTION') {
      console.log('💡 Email connection failed. Check SMTP_HOST and SMTP_PORT in .env');
    }
    
    return false;
  }
}

// Main notification function
async function sendNotifications(appointmentData, bookingId) {
  try {
    console.log('🚀 Starting messaging service...');

    // Prepare message data
    const messageData = {
      customerName: appointmentData.fullName,
      customerPhone: appointmentData.phoneNumber,
      bookingId: bookingId.substring(0, 8).toUpperCase(),
      selectedTests: Array.isArray(appointmentData.tests) ? appointmentData.tests.join(', ') : appointmentData.tests,
      collectionDate: new Date(appointmentData.collectionDate).toLocaleDateString('en-IN'),
      timeSlot: appointmentData.timeSlot,
      address: appointmentData.address
    };

    // Customer WhatsApp message
    const whatsappMessage = `🔬 *PathLab Connect*

Hi ${messageData.customerName}! 

Your lab appointment is CONFIRMED! ✅

📋 *Details:*
🆔 ID: *${messageData.bookingId}*
🧪 Tests: *${messageData.selectedTests}*
📅 Date: *${messageData.collectionDate}*
⏰ Time: *${messageData.timeSlot}*
📍 Address: *${messageData.address}*

*What's Next?*
✅ Booking confirmed
📱 Technician details within 2 hours
🏠 Home collection at scheduled time
📊 Results in 24-48 hours

*Contact:* +91 7979 806 128
*Email:* uniquepathlab05@gmail.com

Thank you! 🙏`;

    const results = {
      whatsapp: false,
      email: false,
      admin: false,
      adminEmail: false
    };

    // Send WhatsApp to customer
    if (appointmentData.phoneNumber) {
      console.log('📱 Sending WhatsApp to customer...');
      results.whatsapp = await sendWhatsAppMessage(appointmentData.phoneNumber, whatsappMessage);
    }

    // 📧 Send Email to PATIENT
    if (appointmentData.emailAddress) {
      console.log('📧 Sending REAL email to patient...');
      results.email = await sendEmail(appointmentData.emailAddress, appointmentData.fullName, messageData, false);
    }

    // 📧 Send Email to ADMIN
    const adminEmail = process.env.ADMIN_EMAIL || 'uniquepathlab05@gmail.com';
    console.log('📧 Sending REAL email to admin...');
    results.adminEmail = await sendEmail(adminEmail, appointmentData.fullName, messageData, true);

    // Send WhatsApp to admin
    const adminWhatsApp = process.env.ADMIN_WHATSAPP;
    if (adminWhatsApp) {
      const adminMessage = `🔔 *NEW APPOINTMENT*

📋 ID: *${messageData.bookingId}*
👤 Customer: *${appointmentData.fullName}*
📱 Phone: *${appointmentData.phoneNumber}*
📅 Date: *${messageData.collectionDate}*
🧪 Tests: *${messageData.selectedTests}*

⚠️ *Action Required:* Assign technician within 2 hours`;

      console.log('🔔 Sending admin WhatsApp notification...');
      results.admin = await sendWhatsAppMessage(`+${adminWhatsApp}`, adminMessage);
    }

    console.log('📊 Final Results:');
    console.log('📱 Customer WhatsApp:', results.whatsapp ? '✅ Sent' : '❌ Failed');
    console.log('📧 Customer Email:', results.email ? '✅ SENT!' : '❌ Failed');
    console.log('📧 Admin Email:', results.adminEmail ? '✅ SENT!' : '❌ Failed');
    console.log('🔔 Admin WhatsApp:', results.admin ? '✅ Sent' : '❌ Failed');

    return results;

  } catch (error) {
    console.error('❌ Messaging service error:', error);
    return { whatsapp: false, email: false, admin: false, adminEmail: false };
  }
}

module.exports = {
  sendNotifications,
  sendWhatsAppMessage,
  sendEmail
};
