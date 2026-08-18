/**
 * Email Service using Resend
 * Handles verification codes, password resets, and transcript delivery
 */

import { Resend } from 'resend';

let resendClient;

const getResendClient = () => {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is required for email operations");
    }

    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@ballpitt.com';

/**
 * Send verification code via email
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit verification code
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendVerificationCode(email, code) {
  try {
    if (!email || !code) {
      return { success: false, error: 'Email and code are required' };
    }

    const result = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify Your BallPitt Account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .code-box { 
                background: #f0f0f0; 
                border: 2px solid #007bff; 
                border-radius: 8px; 
                padding: 20px; 
                text-align: center; 
                margin: 30px 0; 
              }
              .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #007bff; }
              .expiry { color: #666; font-size: 14px; margin-top: 15px; }
              .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Verify Your Email</h1>
              </div>
              <p>Hi there,</p>
              <p>Your email verification code is:</p>
              <div class="code-box">
                <div class="code">${code}</div>
                <div class="expiry">This code expires in 10 minutes</div>
              </div>
              <p>If you didn't request this code, please ignore this email.</p>
              <div class="footer">
                <p>&copy; 2026 BallPitt. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (result.error) {
      console.error('Resend verification email error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset code via email
 * @param {string} email - Recipient email address
 * @param {string} code - Reset code (6 digits or alphanumeric)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendPasswordResetCode(email, code) {
  try {
    if (!email || !code) {
      return { success: false, error: 'Email and code are required' };
    }

    const result = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset Your BallPitt Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .code-box { 
                background: #f0f0f0; 
                border: 2px solid #ff6b6b; 
                border-radius: 8px; 
                padding: 20px; 
                text-align: center; 
                margin: 30px 0; 
              }
              .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ff6b6b; }
              .expiry { color: #666; font-size: 14px; margin-top: 15px; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Reset Your Password</h1>
              </div>
              <p>Hi there,</p>
              <p>We received a request to reset your BallPitt password. Use the code below to reset your password:</p>
              <div class="code-box">
                <div class="code">${code}</div>
                <div class="expiry">This code expires in 10 minutes</div>
              </div>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and your account will remain secure.
              </div>
              <p>Thank you,<br>The BallPitt Team</p>
              <div class="footer">
                <p>&copy; 2026 BallPitt. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (result.error) {
      console.error('Resend password reset email error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending password reset code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send chat transcript via email
 * @param {string} email - Recipient email address
 * @param {object} transcriptData - Transcript data including chatId, messages, summary
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendTranscriptEmail(email, transcriptData) {
  try {
    if (!email || !transcriptData) {
      return { success: false, error: 'Email and transcript data are required' };
    }

    const { chatId, messages = [], visitorName, visitorEmail, chatSummary, messageCount = 0 } = transcriptData;

    // Format messages for email display
    const messagesHTML = messages
      .slice(0, 10) // Show last 10 messages
      .map((msg) => `
        <div style="margin: 10px 0; padding: 10px; background: ${msg.sender === 'host' ? '#e3f2fd' : '#f5f5f5'}; border-radius: 4px;">
          <strong>${msg.sender === 'host' ? 'You' : msg.senderName || 'Visitor'}:</strong><br>
          ${msg.text || ''}
        </div>
      `)
      .join('');

    const result = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Chat Transcript - ${visitorName || 'Demo Chat'} (ID: ${chatId?.slice(-8) || 'N/A'})`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 700px; margin: 0 auto; padding: 20px; }
              .header { border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 20px; }
              .header h2 { color: #007bff; margin: 0 0 10px 0; }
              .info-box { background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
              .info-box p { margin: 8px 0; }
              .messages { 
                background: #fafafa; 
                padding: 15px; 
                border-radius: 4px; 
                margin: 20px 0; 
                max-height: 400px; 
                overflow-y: auto; 
              }
              .message-item { 
                margin: 10px 0; 
                padding: 10px; 
                background: white; 
                border-left: 3px solid #007bff; 
                border-radius: 2px; 
              }
              .summary { background: #f0f8ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
              .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>💬 Chat Transcript</h2>
              </div>

              <div class="info-box">
                <strong>Chat Details:</strong><br>
                <p><strong>Chat ID:</strong> ${chatId || 'N/A'}</p>
                <p><strong>Message Count:</strong> ${messageCount}</p>
              </div>

              ${
                chatSummary
                  ? `
                <div class="summary">
                  <strong>📝 Chat Summary:</strong><br>
                  ${chatSummary}
                </div>
              `
                  : ''
              }

              <div class="messages">
                <strong>📧 Message Exchange:</strong>
                ${messagesHTML || '<p style="color: #999;">No messages in this chat.</p>'}
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <p style="color: #666; font-size: 14px;">End of transcript</p>
              </div>

              <div class="footer">
                <p>&copy; 2026 BallPitt. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (result.error) {
      console.error('Resend transcript email error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending transcript email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test function to verify Resend is working
 * Use this during setup to validate configuration
 */
export async function testResendConnection(testEmail) {
  try {
    const result = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: testEmail,
      subject: 'Test Email - BallPitt Email Service',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>✅ Email Service Test</h2>
              <p>This is a test email from the BallPitt email service.</p>
              <p><strong>If you received this email, Resend is properly configured!</strong></p>
              <p>Configuration Details:</p>
              <ul>
                <li>From Email: ${FROM_EMAIL}</li>
                <li>Timestamp: ${new Date().toISOString()}</li>
                <li>API Status: Connected ✅</li>
              </ul>
            </div>
          </body>
        </html>
      `,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error testing Resend connection:', error);
    return { success: false, error: error.message };
  }
}
