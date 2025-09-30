const https = require('https');
const emailjs = require('@emailjs/nodejs');

// ✅ Add this debug function at the top
async function debugEmailJS() {
    try {
        console.log('🔍 EmailJS Debug Check:');
        console.log('Node version:', process.version);
        
        // Check if package exists
        try {
            const emailjs = require('@emailjs/nodejs');
            console.log('✅ @emailjs/nodejs package loaded successfully');
            console.log('📦 EmailJS type:', typeof emailjs);
            console.log('🔧 EmailJS methods:', Object.keys(emailjs));
        } catch (requireError) {
            console.log('❌ Failed to require @emailjs/nodejs:', requireError.message);
            return false;
        }
        
        // Check environment variables
        console.log('🔍 Environment Variables:');
        console.log('EMAILJS_SERVICE_ID:', process.env.EMAILJS_SERVICE_ID ? 'SET' : 'MISSING');
        console.log('EMAILJS_PUBLIC_KEY:', process.env.EMAILJS_PUBLIC_KEY ? 'SET' : 'MISSING');
        console.log('EMAILJS_PATIENT_TEMPLATE_ID:', process.env.EMAILJS_PATIENT_TEMPLATE_ID ? 'SET' : 'MISSING');
        console.log('EMAILJS_ADMIN_TEMPLATE_ID:', process.env.EMAILJS_ADMIN_TEMPLATE_ID ? 'SET' : 'MISSING');
        
        return true;
    } catch (error) {
        console.log('❌ EmailJS Debug Error:', error);
        return false;
    }
}

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
// Updated sendEmail function for your messaging.js
async function sendEmail(recipientEmail, customerName, messageData, isAdmin = false) {
    try {
        // Run debug check first
        const debugOk = await debugEmailJS();
        if (!debugOk) {
            console.log('❌ EmailJS debug check failed');
            return false;
        }
        
        // Import EmailJS
        let emailjs;
        try {
            emailjs = require('@emailjs/nodejs');
            console.log('✅ EmailJS imported successfully');
        } catch (importError) {
            console.log('❌ Failed to import EmailJS:', importError.message);
            return false;
        }
        
        const serviceId = process.env.EMAILJS_SERVICE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY;
        const privateKey = process.env.EMAILJS_PRIVATE_KEY;
        
        // Different template IDs
        const templateId = isAdmin ? 
            process.env.EMAILJS_ADMIN_TEMPLATE_ID || 'admin_template' : 
            process.env.EMAILJS_PATIENT_TEMPLATE_ID || 'patient_template';
        
        console.log('🔧 Using credentials:');
        console.log('Service ID:', serviceId ? serviceId.substring(0, 8) + '...' : 'MISSING');
        console.log('Template ID:', templateId);
        console.log('Public Key:', publicKey ? publicKey.substring(0, 8) + '...' : 'MISSING');
        
        if (!serviceId || !publicKey || !templateId) {
            console.log('❌ EmailJS credentials missing in environment variables');
            return false;
        }

        let templateParams;
        
        if (isAdmin) {
            templateParams = {
                subject: `🚨 NEW APPOINTMENT - ${messageData.bookingId}`,
                booking_id: messageData.bookingId,
                customer_name: customerName,
                customer_phone: messageData.customerPhone,
                customer_email: messageData.customerEmail,
                selected_tests: messageData.selectedTests,
                collection_date: messageData.collectionDate,
                time_slot: messageData.timeSlot,
                address: messageData.address,
                booking_time: new Date().toLocaleString('en-IN')
            };
        } else {
            templateParams = {
                to_email: recipientEmail,
                subject: `Lab Appointment Confirmed - Booking ID ${messageData.bookingId}`,
                customer_name: customerName,
                customer_phone: messageData.customerPhone,
                booking_id: messageData.bookingId,
                selected_tests: messageData.selectedTests,
                collection_date: messageData.collectionDate,
                time_slot: messageData.timeSlot,
                address: messageData.address
            };
        }

        console.log(`🚀 Sending ${isAdmin ? 'admin' : 'patient'} email via EmailJS...`);
        console.log('📊 Template params keys:', Object.keys(templateParams));

        // Send email with enhanced error handling
        const response = await emailjs.send(
            serviceId,
            templateId,
            templateParams,
            {
                publicKey: publicKey,
                privateKey: privateKey,
            }
        );

        console.log('✅ EmailJS SUCCESS!');
        console.log('📊 Response status:', response.status);
        console.log('📊 Response text:', response.text);
        return true;

    } catch (error) {
        console.log('❌ DETAILED EmailJS ERROR:');
        console.log('Error type:', typeof error);
        console.log('Error message:', error?.message || 'No message');
        console.log('Error status:', error?.status || 'No status');
        console.log('Error code:', error?.code || 'No code');
        console.log('Full error:', error);
        
        // Specific error types
        if (error?.message?.includes('MODULE_NOT_FOUND')) {
            console.log('🔧 FIX: Install @emailjs/nodejs package');
        } else if (error?.status === 422) {
            console.log('🔧 FIX: Check template configuration');
        } else if (error?.status === 401) {
            console.log('🔧 FIX: Check public/private keys');
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
      customerEmail: appointmentData.emailAddress,
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
