import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import * as nodemailer from 'nodemailer';

const storage = new Storage();

interface SendExportEmailRequest {
  fileData: string; // Base64 encoded file data
  fileName: string;
  format: 'csv' | 'json' | 'pdf';
  recipientEmail: string;
  userId: string;
}

interface SendExportEmailResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}

/**
 * Cloud Function to send export files via email
 * Uploads file to Cloud Storage, generates signed URL, and sends email
 */
export const sendExportEmail = functions.https.onCall(
  async (
    data: SendExportEmailRequest,
    context: functions.https.CallableContext
  ): Promise<SendExportEmailResponse> => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to send export emails'
      );
    }

    // Verify user ID matches authenticated user
    if (context.auth.uid !== data.userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User can only send exports for their own data'
      );
    }

    try {
      // Validate input
      if (!data.fileData || !data.fileName || !data.format || !data.recipientEmail) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required fields: fileData, fileName, format, or recipientEmail'
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.recipientEmail)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid email address format'
        );
      }

      // Validate file format
      if (!['csv', 'json', 'pdf'].includes(data.format)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid format. Must be csv, json, or pdf'
        );
      }

      // Convert base64 to buffer
      const fileBuffer = Buffer.from(data.fileData, 'base64');

      // Validate file size (max 10MB)
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB
      if (fileBuffer.length > maxSizeBytes) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'File size exceeds 10MB limit'
        );
      }

      // Upload file to Cloud Storage
      const bucketName = `${admin.app().options.projectId}.appspot.com`;
      const bucket = storage.bucket(bucketName);
      
      // Generate unique file path
      const timestamp = Date.now();
      const filePath = `exports/${data.userId}/${timestamp}_${data.fileName}`;
      const file = bucket.file(filePath);

      // Set content type based on format
      const contentTypes = {
        csv: 'text/csv',
        json: 'application/json',
        pdf: 'application/pdf'
      };

      // Upload file with metadata
      await file.save(fileBuffer, {
        metadata: {
          contentType: contentTypes[data.format],
          metadata: {
            userId: data.userId,
            exportFormat: data.format,
            createdAt: new Date().toISOString()
          }
        }
      });

      // Generate signed URL (valid for 7 days)
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Send email
      await sendEmailWithDownloadLink(
        data.recipientEmail,
        data.fileName,
        data.format,
        signedUrl
      );

      // Schedule file deletion after 7 days
      await scheduleFileDeletion(filePath, 7);

      return {
        success: true,
        downloadUrl: signedUrl
      };

    } catch (error) {
      console.error('Error sending export email:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Return error response instead of throwing for better UX
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
);

/**
 * Send email with download link using nodemailer
 */
async function sendEmailWithDownloadLink(
  recipientEmail: string,
  fileName: string,
  format: string,
  downloadUrl: string
): Promise<void> {
  // Configure email transporter
  // Note: In production, you would use a proper email service like SendGrid, Mailgun, etc.
  // For now, we'll use a generic SMTP configuration that can be set via environment variables
  const transporter = nodemailer.createTransport({
    host: functions.config().email?.smtp_host || 'smtp.gmail.com',
    port: parseInt(functions.config().email?.smtp_port || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: functions.config().email?.smtp_user,
      pass: functions.config().email?.smtp_pass,
    },
  });

  // Email content
  const subject = 'Your Habit Tracker Export is Ready';
  const formatName = format.toUpperCase();
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .download-button { 
          display: inline-block; 
          background-color: #6366f1; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Export is Ready!</h1>
        </div>
        <div class="content">
          <p>Hello!</p>
          
          <p>Your habit tracking data export has been successfully generated and is ready for download.</p>
          
          <p><strong>Export Details:</strong></p>
          <ul>
            <li>File Name: ${fileName}</li>
            <li>Format: ${formatName}</li>
            <li>Generated: ${new Date().toLocaleString()}</li>
          </ul>
          
          <p>Click the button below to download your export:</p>
          
          <a href="${downloadUrl}" class="download-button">Download ${formatName} Export</a>
          
          <p><strong>Important:</strong> This download link will expire in 7 days for security reasons. Please download your file soon.</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Happy habit tracking!</p>
        </div>
        <div class="footer">
          <p>This email was sent from your Habit Tracker app. If you didn't request this export, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Your Habit Tracker Export is Ready!

Hello!

Your habit tracking data export has been successfully generated and is ready for download.

Export Details:
- File Name: ${fileName}
- Format: ${formatName}
- Generated: ${new Date().toLocaleString()}

Download your export here: ${downloadUrl}

Important: This download link will expire in 7 days for security reasons. Please download your file soon.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Happy habit tracking!

---
This email was sent from your Habit Tracker app. If you didn't request this export, please ignore this email.
  `;

  // Send email
  await transporter.sendMail({
    from: functions.config().email?.from_address || '"Habit Tracker" <noreply@habittracker.com>',
    to: recipientEmail,
    subject: subject,
    text: textContent,
    html: htmlContent,
  });
}

/**
 * Schedule file deletion after specified number of days
 */
async function scheduleFileDeletion(filePath: string, days: number): Promise<void> {
  // In a production environment, you might use Cloud Tasks or Cloud Scheduler
  // For now, we'll use a simple Firestore document with TTL
  const db = admin.firestore();
  
  const deleteAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  
  await db.collection('scheduled_deletions').add({
    filePath: filePath,
    deleteAt: deleteAt,
    type: 'export_file',
    createdAt: new Date()
  });
}