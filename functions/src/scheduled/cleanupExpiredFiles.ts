import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();

/**
 * Scheduled function to clean up expired export files
 * Runs daily at 2 AM UTC
 */
export const cleanupExpiredFiles = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting cleanup of expired export files...');
    
    const db = admin.firestore();
    const now = new Date();
    
    try {
      // Query for files that should be deleted
      const expiredFilesQuery = await db
        .collection('scheduled_deletions')
        .where('deleteAt', '<=', now)
        .where('type', '==', 'export_file')
        .limit(100) // Process in batches
        .get();

      if (expiredFilesQuery.empty) {
        console.log('No expired files to clean up');
        return;
      }

      const bucketName = `${admin.app().options.projectId}.appspot.com`;
      const bucket = storage.bucket(bucketName);
      
      const batch = db.batch();
      let deletedCount = 0;
      let errorCount = 0;

      for (const doc of expiredFilesQuery.docs) {
        const data = doc.data();
        const filePath = data.filePath;

        try {
          // Delete file from Cloud Storage
          const file = bucket.file(filePath);
          const [exists] = await file.exists();
          
          if (exists) {
            await file.delete();
            console.log(`Deleted file: ${filePath}`);
          } else {
            console.log(`File already deleted or doesn't exist: ${filePath}`);
          }

          // Mark document for deletion from Firestore
          batch.delete(doc.ref);
          deletedCount++;

        } catch (error) {
          console.error(`Error deleting file ${filePath}:`, error);
          errorCount++;
          
          // Still delete the Firestore document to avoid retrying forever
          batch.delete(doc.ref);
        }
      }

      // Commit Firestore batch
      await batch.commit();

      console.log(`Cleanup completed. Deleted: ${deletedCount}, Errors: ${errorCount}`);

    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  });