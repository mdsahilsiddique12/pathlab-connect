const https = require('https');

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

//// REAL Email Sending Function using EmailJS with HTML content from code
async function sendEmail(recipientEmail, customerName, messageData, isAdmin = false) {
    try {
        // ✅ ADD THESE DEBUG LOGS
        console.log('🔍 Environment Variables Check:');
        console.log('EMAILJS_SERVICE_ID:', process.env.EMAILJS_SERVICE_ID ? 'Present' : '❌ Missing');
        console.log('EMAILJS_TEMPLATE_ID:', process.env.EMAILJS_TEMPLATE_ID ? 'Present' : '❌ Missing');
        console.log('EMAILJS_PUBLIC_KEY:', process.env.EMAILJS_PUBLIC_KEY ? 'Present' : '❌ Missing');
        console.log('EMAILJS_PRIVATE_KEY:', process.env.EMAILJS_PRIVATE_KEY ? 'Present' : '❌ Missing');
        
        const serviceId = process.env.EMAILJS_SERVICE_ID;
        const templateId = process.env.EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY;
        const privateKey = process.env.EMAILJS_PRIVATE_KEY;
        
        if (!serviceId || !publicKey || !templateId) {
            console.log('❌ EmailJS credentials missing in .env file');
            return false;
        }

        console.log('📦 Requiring EmailJS...');
        const emailjs = require('@emailjs/nodejs');
        console.log('✅ EmailJS loaded successfully:', typeof emailjs);

        
        // Import EmailJS
        const emailjs = require('@emailjs/nodejs');

        let htmlContent, subject;
        
        if (isAdmin) {
            // ADMIN EMAIL - Generated HTML content
            subject = `🚨 NEW APPOINTMENT - ${messageData.bookingId}`;
            htmlContent = `
            <div style="font-family: system-ui, sans-serif, Arial; font-size: 14px; color: #333; padding: 14px 8px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: auto; background-color: #fff">
                    <div style="border-top: 6px solid #e74c3c; padding: 16px; background-color: #fff2f2;">
                        <h2 style="margin: 0; color: #c0392b;">🚨 NEW APPOINTMENT ALERT</h2>
                        <p style="margin: 5px 0; color: #666;">PathLab Connect Admin Panel</p>
                    </div>
                    
                    <div style="padding: 20px;">
                        <p style="color: #333; font-size: 16px;"><strong>New lab appointment has been booked!</strong></p>
                        <p>A customer has successfully booked an appointment. Please review and assign a technician.</p>
                        
                        <div style="background: #fff8e1; border: 1px solid #ffd54f; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #f57c00;">📋 Booking Details #${messageData.bookingId}</h3>
                            
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px; font-weight: 600; color: #4a5568; width: 40%;">🆔 Booking ID:</td><td style="padding: 8px;">${messageData.bookingId}</td></tr>
                                <tr style="background-color: #f8faff;"><td style="padding: 8px; font-weight: 600; color: #4a5568;">👤 Customer:</td><td style="padding: 8px;">${customerName}</td></tr>
                                <tr><td style="padding: 8px; font-weight: 600; color: #4a5568;">📱 Phone:</td><td style="padding: 8px;">${messageData.customerPhone}</td></tr>
                                <tr style="background-color: #f8faff;"><td style="padding: 8px; font-weight: 600; color: #4a5568;">📧 Email:</td><td style="padding: 8px;">${recipientEmail}</td></tr>
                                <tr><td style="padding: 8px; font-weight: 600; color: #4a5568;">🧪 Tests:</td><td style="padding: 8px;">${messageData.selectedTests}</td></tr>
                                <tr style="background-color: #f8faff;"><td style="padding: 8px; font-weight: 600; color: #4a5568;">📅 Date:</td><td style="padding: 8px;">${messageData.collectionDate}</td></tr>
                                <tr><td style="padding: 8px; font-weight: 600; color: #4a5568;">⏰ Time:</td><td style="padding: 8px;">${messageData.timeSlot}</td></tr>
                                <tr style="background-color: #f8faff;"><td style="padding: 8px; font-weight: 600; color: #4a5568;">📍 Address:</td><td style="padding: 8px;">${messageData.address}</td></tr>
                            </table>
                        </div>
                        
                        <div style="background: #ffebee; border: 1px solid #e57373; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin: 0 0 15px 0; color: #d32f2f;">⚠️ ACTION REQUIRED</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #c62828;">
                                <li style="margin-bottom: 8px;"><strong>Assign technician within 2 hours</strong></li>
                                <li style="margin-bottom: 8px;"><strong>Contact customer to confirm timing</strong></li>
                                <li style="margin-bottom: 8px;"><strong>Prepare test equipment</strong></li>
                                <li style="margin-bottom: 8px;"><strong>Update appointment status in system</strong></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div style="background: #2d3748; color: white; padding: 25px; text-align: center;">
                        <p style="margin: 5px 0;"><strong>PathLab Connect Admin Panel</strong></p>
                        <p style="margin: 5px 0;">📞 Emergency: +91-7979806128</p>
                        <p style="margin: 5px 0;">⏰ Booking Time: ${new Date().toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>`;
            
        } else {
            // PATIENT EMAIL - Your beautiful HTML template with variables replaced
            subject = `Lab Appointment Confirmed - Booking ID ${messageData.bookingId}`;
            htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PathLab Connect - Booking Confirmation</title>
            </head>
            <body>
            <div style="font-family: system-ui, sans-serif, Arial; font-size: 14px; color: #333; padding: 14px 8px; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: auto; background-color: #fff">
                <div style="border-top: 6px solid #458500; padding: 16px">
                  <a style="text-decoration: none; outline: none; margin-right: 8px; vertical-align: middle" href="https://pathlabconnect.up.railway.app" target="_blank">
                    <img style="height: 32px; vertical-align: middle" height="32px" src="https://via.placeholder.com/100x32/458500/ffffff?text=PathLab" alt="PathLab Connect" />
                  </a>
                  <span style="font-size: 16px; vertical-align: middle; border-left: 1px solid #333; padding-left: 8px;">
                    <strong>🧪 PathLab Connect - Booking Confirmed</strong>
                  </span>
                </div>
                <div style="padding: 0 16px">
                  <p>Hello ${customerName}! 👋</p>
                  <p>Thank you for choosing PathLab Connect. Your booking has been <strong>successfully confirmed</strong>!</p>
                  <p>Our team will contact you soon to finalize the collection details.</p>
                  
                  <div style="text-align: left; font-size: 14px; padding-bottom: 4px; border-bottom: 2px solid #333; margin: 20px 0;">
                    <strong>📋 Booking Details #${messageData.bookingId}</strong>
                  </div>

                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="vertical-align: top">
                      <td style="padding: 8px; font-weight: 600; color: #4a5568; width: 40%;">🆔 Booking ID:</td>
                      <td style="padding: 8px; color: #1a202c;">${messageData.bookingId}</td>
                    </tr>
                    <tr style="vertical-align: top; background-color: #f8faff;">
                      <td style="padding: 8px; font-weight: 600; color: #4a5568;">👤 Customer Name:</td>
                      <td style="padding: 8px; color: #1a202c;">${customerName}</td>
                    </tr>
                    <tr style="vertical-align: top">
                      <td style="padding: 8px; font-weight: 600; color: #4a5568;">📱 Phone Number:</td>
                      <td style="padding: 8px; color: #1a202c;">${messageData.customerPhone}</td>
                    </tr>
                    <tr style="vertical-align: top; background-color: #f8faff;">
                      <td style="padding: 8px; font-weight: 600; color: #4a5568;">🧪 Selected Tests:</td>
                      <td style="padding: 8px; color: #1a202c;">${messageData.selectedTests}</td>
                    </tr>
                    <tr style="vertical-align: top">
                      <td style="padding: 8px; font-weight: 600; color: #4a5568;">📅 Collection Date:</td>
                      <td style="padding: 8px; color: #1a202c;">${messageData.collectionDate}</td>
                    </tr>
                    <tr style="vertical-align: top; background-color: #f8faff;">
                      <td style="padding: 8px; font-weight: 600; color: #4a5568;">⏰ Time Slot:</td>
                      <td style="padding: 8px; color: #1a202c;">${messageData.timeSlot}</td>
                    </tr>
                    <tr style="vertical-align: top">
                      <td style="padding: 8px; font-weight: 600; color: #4a5568;">📍 Collection Address:</td>
                      <td style="padding: 8px; color: #1a202c;">${messageData.address}</td>
                    </tr>
                  </table>

                  <div style="padding: 24px 0">
                    <div style="border-top: 2px solid #333"></div>
                  </div>
                  
                  <div style="background: #fff8e1; border: 1px solid #ffd54f; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin: 0 0 15px 0; color: #f57c00;">📝 Important Instructions</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                      <li style="margin-bottom: 8px; color: #e65100;"><strong>Fasting Requirements:</strong> Please fast for 10-12 hours if blood sugar tests are included</li>
                      <li style="margin-bottom: 8px; color: #e65100;"><strong>Sample Collection:</strong> Our technician will arrive at your specified time</li>
                      <li style="margin-bottom: 8px; color: #e65100;"><strong>Payment:</strong> Can be made during sample collection (Cash/UPI)</li>
                      <li style="margin-bottom: 8px; color: #e65100;"><strong>Reports:</strong> Will be available within 24-48 hours via WhatsApp and email</li>
                      <li style="margin-bottom: 8px; color: #e65100;"><strong>Rescheduling:</strong> Contact us at least 2 hours before appointment</li>
                    </ul>
                  </div>

                </div>
                
                <div style="background: #2d3748; color: white; padding: 25px; text-align: center;">
                  <p style="margin: 5px 0;"><strong>PathLab Connect</strong> - Your Health, Our Priority</p>
                  <div style="margin-top: 20px;">
                    <p style="margin: 5px 0;">📞 Customer Care: +91-7979806128</p>
                    <p style="margin: 5px 0;">📧 Email: uniquepathlab05@gmail.com</p>
                    <p style="margin: 5px 0;">🌐 Website: www.pathlabconnect.up.railway.app</p>
                  </div>
                  <p style="font-size: 12px; margin-top: 15px; opacity: 0.8;">
                    © 2024 PathLab Connect. All rights reserved.
                  </p>
                </div>
              </div>
              
              <div style="max-width: 600px; margin: auto">
                <p style="color: #999; text-align: center; margin-top: 30px;">
                  Need to make changes? Contact us immediately at <strong>+91-7979806128</strong><br />
                  The email was sent to ${recipientEmail}
                </p>
              </div>
            </div>
            </body>
            </html>`;
        }

        const templateParams = {
            to_email: recipientEmail,
            subject: subject,
            html_content: htmlContent // This will be inserted using {{{html_content}}}
        };

        console.log(`Sending ${isAdmin ? 'admin' : 'patient'} email via EmailJS to:`, recipientEmail);

        // Send email using EmailJS
        const response = await emailjs.send(
            serviceId,
            templateId,
            templateParams,
            {
                publicKey: publicKey,
                privateKey: privateKey,
            }
        );

        console.log('EmailJS response:', response.status, response.text);
        console.log('Email sent successfully via EmailJS!');
        console.log('Email sent to:', recipientEmail);
        return true;

    } catch (error) {
        console.error('EmailJS send error:', error.message);
        
        // Provide helpful error messages
        if (error.status === 400) {
            console.log('EmailJS Bad Request: Check template parameters and IDs');
        } else if (error.status === 401) {
            console.log('EmailJS Unauthorized: Check your public/private keys');
        } else if (error.status === 402) {
            console.log('EmailJS Payment Required: Check your EmailJS account limits');
        } else if (error.status === 404) {
            console.log('EmailJS Not Found: Check your service ID and template ID');
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
