// =======================================
// PathLab Connect - Advanced Messaging System
// Handles WhatsApp and Email notifications with professional templates
// =======================================

const axios = require('axios');
const { Resend } = require('resend'); // ✅ CHANGED: Using Resend instead of nodemailer

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY); // ✅ CHANGED: Resend initialization

console.log('🚀 Starting messaging service...');

// =======================================
// WHATSAPP MESSAGING SERVICE
// =======================================

const sendWhatsAppMessage = async (recipientPhone, message) => {
    console.log(`📱 Sending WhatsApp to customer...`);
    
    try {
        const whatsappData = {
            messaging_product: "whatsapp",
            to: recipientPhone,
            type: "text",
            text: {
                body: message
            }
        };

        const response = await axios.post(
            'https://graph.facebook.com/v18.0/510518432165203/messages',
            whatsappData,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`WhatsApp API Response Status: ${response.status}`);
        
        if (response.status === 200) {
            console.log('✅ WhatsApp message sent successfully');
            return true;
        } else {
            console.log('❌ WhatsApp sending failed');
            return false;
        }
    } catch (error) {
        console.error('❌ WhatsApp Error:', error.response?.data || error.message);
        return false;
    }
};

// =======================================
// EMAIL SERVICE WITH RESEND
// =======================================

const sendEmail = async (recipientEmail, subject, htmlContent, textContent) => {
    console.log('📧 Sending REAL email to patient...');
    console.log('📧 Setting up email transporter...');
    
    try {
        // ✅ CHANGED: Using Resend instead of nodemailer
        const data = await resend.emails.send({
            from: 'PathLab Connect <noreply@pathlabconnect.com>', // ✅ Update with your domain
            to: [recipientEmail],
            subject: subject,
            html: htmlContent,
            text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
        });

        console.log('✅ Email sent successfully:', data);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return false;
    }
};

// =======================================
// EMAIL TEMPLATES (UNCHANGED)
// =======================================

const generateCustomerEmailTemplate = (messageData) => {
    const customerName = messageData.customerName || 'Valued Customer';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PathLab Connect - Booking Confirmation</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .booking-card { background: #f8faff; border-left: 4px solid #667eea; padding: 25px; margin: 25px 0; border-radius: 8px; }
        .booking-card h3 { margin: 0 0 20px 0; color: #1a202c; font-size: 20px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
        .detail-label { font-weight: 600; color: #4a5568; }
        .detail-value { color: #1a202c; }
        .status-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; display: inline-block; margin: 20px 0; }
        .instructions { background: #fff8e1; border: 1px solid #ffd54f; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .instructions h4 { margin: 0 0 15px 0; color: #f57c00; }
        .instructions ul { margin: 0; padding-left: 20px; }
        .instructions li { margin-bottom: 8px; color: #e65100; }
        .footer { background: #2d3748; color: white; padding: 25px; text-align: center; }
        .footer p { margin: 5px 0; }
        .contact-info { margin-top: 20px; }
        .button { background: #667eea; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 PathLab Connect</h1>
            <p>Professional Diagnostic Services</p>
        </div>
        
        <div class="content">
            <h2 style="color: #1a202c; margin-bottom: 10px;">Hello ${customerName}! 👋</h2>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Thank you for choosing PathLab Connect. Your booking has been <strong>successfully confirmed</strong>! 
                Our team will contact you soon to finalize the collection details.
            </p>
            
            <div class="status-badge">✅ Booking Confirmed</div>
            
            <div class="booking-card">
                <h3>📋 Your Booking Details</h3>
                <div class="detail-row">
                    <span class="detail-label">🆔 Booking ID:</span>
                    <span class="detail-value">${messageData.bookingId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">👤 Customer Name:</span>
                    <span class="detail-value">${customerName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📱 Phone Number:</span>
                    <span class="detail-value">${messageData.customerPhone}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🧪 Selected Tests:</span>
                    <span class="detail-value">${messageData.selectedTests}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📅 Collection Date:</span>
                    <span class="detail-value">${messageData.collectionDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏰ Time Slot:</span>
                    <span class="detail-value">${messageData.timeSlot}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📍 Collection Address:</span>
                    <span class="detail-value">${messageData.address}</span>
                </div>
            </div>
            
            <div class="instructions">
                <h4>📝 Important Instructions</h4>
                <ul>
                    <li><strong>Fasting Requirements:</strong> Please fast for 10-12 hours if blood sugar tests are included</li>
                    <li><strong>Sample Collection:</strong> Our technician will arrive at your specified time</li>
                    <li><strong>Payment:</strong> Can be made during sample collection (Cash/UPI)</li>
                    <li><strong>Reports:</strong> Will be available within 24-48 hours via WhatsApp and email</li>
                    <li><strong>Rescheduling:</strong> Contact us at least 2 hours before appointment</li>
                </ul>
            </div>
            
            <p style="color: #4a5568; font-size: 14px; text-align: center; margin-top: 30px;">
                Need to make changes? Contact us immediately at <strong>+91-XXXXXXXXXX</strong>
            </p>
        </div>
        
        <div class="footer">
            <p><strong>PathLab Connect</strong> - Your Health, Our Priority</p>
            <div class="contact-info">
                <p>📞 Customer Care: +91-XXXXXXXXXX</p>
                <p>📧 Email: support@pathlabconnect.com</p>
                <p>🌐 Website: www.pathlabconnect.com</p>
            </div>
            <p style="font-size: 12px; margin-top: 15px; opacity: 0.8;">
                © 2024 PathLab Connect. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`;
};

const generateAdminEmailTemplate = (messageData) => {
    const customerName = messageData.customerName || 'Customer';
    const recipientEmail = messageData.customerEmail || 'Not provided';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PathLab Connect - New Booking Alert</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #e53e3e 0%, #dd6b20 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
        .alert-badge { background: #feb2b2; color: #742a2a; padding: 12px 20px; border-radius: 25px; font-weight: 700; display: inline-block; margin: 15px 0; }
        .content { padding: 35px 30px; }
        .booking-details { background: #fed7d7; border-left: 4px solid #e53e3e; padding: 25px; margin: 20px 0; border-radius: 8px; }
        .booking-details h3 { margin: 0 0 20px 0; color: #742a2a; font-size: 18px; }
        .detail-item { margin-bottom: 12px; }
        .detail-label { font-weight: 700; color: #742a2a; display: inline-block; min-width: 140px; }
        .detail-value { color: #1a202c; }
        .action-section { background: #ffeaa7; border: 2px solid #fdcb6e; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .action-section h4 { margin: 0 0 15px 0; color: #e17055; font-size: 16px; }
        .action-list { margin: 0; padding-left: 20px; }
        .action-list li { margin-bottom: 8px; color: #d63031; font-weight: 500; }
        .footer { background: #2d3748; color: white; padding: 20px; text-align: center; }
        .urgent { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 PathLab Connect - Admin Alert</h1>
            <p>New Booking Notification System</p>
        </div>
        
        <div class="content">
            <div class="alert-badge urgent">🔔 NEW BOOKING RECEIVED!</div>
            
            <p style="color: #742a2a; font-size: 16px; font-weight: 600; margin-bottom: 25px;">
                A new booking has been submitted and requires immediate attention from the admin team.
            </p>
            
            <div class="booking-details">
                <h3>📋 New Booking Details:</h3>
                
                <div class="detail-item">
                    <span class="detail-label">🆔 Booking ID:</span>
                    <span class="detail-value">${messageData.bookingId}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">👤 Customer:</span>
                    <span class="detail-value">${customerName}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">📱 Phone:</span>
                    <span class="detail-value">${messageData.customerPhone}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">📧 Email:</span>
                    <span class="detail-value">${recipientEmail}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">🧪 Tests:</span>
                    <span class="detail-value">${messageData.selectedTests}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">📅 Collection Date:</span>
                    <span class="detail-value">${messageData.collectionDate}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">⏰ Time Slot:</span>
                    <span class="detail-value">${messageData.timeSlot}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">📍 Address:</span>
                    <span class="detail-value">${messageData.address}</span>
                </div>
            </div>
            
            <div class="action-section">
                <h4>⚠️ ACTION REQUIRED:</h4>
                <ul class="action-list">
                    <li>Assign technician within 2 hours</li>
                    <li>Contact customer to confirm timing</li>
                    <li>Prepare test equipment</li>
                    <li>Update booking status in admin panel</li>
                    <li>Schedule reminder notifications</li>
                </ul>
            </div>
            
            <p style="color: #e53e3e; font-weight: 600; text-align: center; margin-top: 25px;">
                ⏰ Time Received: ${new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}
            </p>
        </div>
        
        <div class="footer">
            <p><strong>PathLab Connect Admin System</strong></p>
            <p style="font-size: 12px; opacity: 0.8;">
                This is an automated notification. Please take immediate action.
            </p>
        </div>
    </div>
</body>
</html>`;
};

// =======================================
// WHATSAPP TEMPLATES (UNCHANGED)
// =======================================

const generateCustomerWhatsAppMessage = (messageData) => {
    const customerName = messageData.customerName || 'Valued Customer';
    
    return `🧪 *PathLab Connect* - Booking Confirmed! ✅

Hello ${customerName}! 👋

Thank you for choosing our services. Your booking has been *successfully confirmed*!

📋 *BOOKING DETAILS:*
🆔 ID: ${messageData.bookingId}
👤 Name: ${customerName}
📱 Phone: ${messageData.customerPhone}
🧪 Tests: ${messageData.selectedTests}
📅 Date: ${messageData.collectionDate}
⏰ Time: ${messageData.timeSlot}
📍 Address: ${messageData.address}

📝 *IMPORTANT INSTRUCTIONS:*
• Fast for 10-12 hours if blood sugar tests included
• Our technician will arrive at scheduled time
• Payment during collection (Cash/UPI)
• Reports in 24-48 hours via WhatsApp & Email
• For changes, contact us 2+ hours before

Need help? Call: +91-XXXXXXXXXX

*PathLab Connect* - Your Health, Our Priority! 🏥✨`;
};

const generateAdminWhatsAppMessage = (messageData) => {
    const customerName = messageData.customerName || 'Customer';
    
    return `🚨 *ADMIN ALERT* - New Booking! 

📋 *BOOKING DETAILS:*
🆔 ID: ${messageData.bookingId}
👤 Customer: ${customerName}
📱 Phone: ${messageData.customerPhone}
🧪 Tests: ${messageData.selectedTests}
📅 Date: ${messageData.collectionDate}
⏰ Time: ${messageData.timeSlot}
📍 Address: ${messageData.address}

⚠️ *ACTION REQUIRED:*
• Assign technician within 2 hours
• Contact customer to confirm
• Prepare equipment
• Update admin panel

⏰ Received: ${new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}

*Take immediate action required!*`;
};

// =======================================
// MAIN NOTIFICATION FUNCTIONS (UNCHANGED)
// =======================================

const sendCustomerNotifications = async (messageData) => {
    const results = {
        whatsapp: false,
        email: false
    };

    console.log('📱 Starting customer notifications...');

    // Send WhatsApp
    const whatsappMessage = generateCustomerWhatsAppMessage(messageData);
    results.whatsapp = await sendWhatsAppMessage(messageData.customerPhone, whatsappMessage);

    // Send Email
    const emailHtml = generateCustomerEmailTemplate(messageData);
    const subject = `🧪 PathLab Connect - Booking Confirmed #${messageData.bookingId}`;
    results.email = await sendEmail(messageData.customerEmail, subject, emailHtml);

    return results;
};

const sendAdminNotifications = async (messageData) => {
    const adminPhone = process.env.ADMIN_PHONE || '+919876543210';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pathlabconnect.com';

    const results = {
        admin: false,
        adminEmail: false
    };

    console.log('🔔 Sending admin notifications...');

    // Send WhatsApp to Admin
    const adminWhatsAppMessage = generateAdminWhatsAppMessage(messageData);
    results.admin = await sendWhatsAppMessage(adminPhone, adminWhatsAppMessage);

    // Send Email to Admin
    const adminEmailHtml = generateAdminEmailTemplate(messageData);
    const adminSubject = `🚨 New Booking Alert #${messageData.bookingId} - Action Required`;
    results.adminEmail = await sendEmail(adminEmail, adminSubject, adminEmailHtml);

    return results;
};

// =======================================
// MAIN EXPORT FUNCTION (UNCHANGED)
// =======================================

const processBookingNotifications = async (messageData) => {
    console.log('📡 Starting background notification service...');
    
    try {
        // Send customer notifications
        const customerResults = await sendCustomerNotifications(messageData);
        
        // Send admin notifications  
        const adminResults = await sendAdminNotifications(messageData);
        
        // Combine results
        const finalResults = {
            whatsapp: customerResults.whatsapp,
            email: customerResults.email,
            admin: adminResults.admin,
            adminEmail: adminResults.adminEmail
        };
        
        // Log final status
        console.log('📊 Final Results:');
        console.log(`📱 Customer WhatsApp: ${finalResults.whatsapp ? '✅ Sent' : '❌ Failed'}`);
        console.log(`📧 Customer Email: ${finalResults.email ? '✅ Sent' : '❌ Failed'}`);
        console.log(`📧 Admin Email: ${finalResults.adminEmail ? '✅ Sent' : '❌ Failed'}`);
        console.log(`🔔 Admin WhatsApp: ${finalResults.admin ? '✅ Sent' : '❌ Failed'}`);
        
        return finalResults;
        
    } catch (error) {
        console.error('❌ Background notification error:', error);
        return {
            whatsapp: false,
            email: false, 
            admin: false,
            adminEmail: false
        };
    }
};

module.exports = {
    processBookingNotifications,
    sendCustomerNotifications,
    sendAdminNotifications,
    sendWhatsAppMessage,
    sendEmail,
    sendNotifications: processBookingNotifications
};

console.log('✅ Messaging service loaded successfully');
