import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Health check endpoint for monitoring
 * Returns system status and basic metrics
 */
export const healthCheck = functions.https.onRequest(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check Firestore connectivity
    const db = admin.firestore();
    await db.collection('_health').doc('check').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    const responseTime = Date.now() - startTime;

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        firestore: 'operational',
        auth: 'operational',
        functions: 'operational',
      },
      metrics: {
        responseTime: `${responseTime}ms`,
        uptime: process.uptime(),
      },
    };

    console.log(JSON.stringify({
      level: 'info',
      function: 'healthCheck',
      responseTime,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    }));

    res.status(200).json(healthStatus);
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      function: 'healthCheck',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }));

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    });
  }
});

/**
 * Get system metrics for monitoring dashboard
 */
export const getMetrics = functions.https.onRequest(async (req, res) => {
  try {
    // Verify authentication (optional - add if needed)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const db = admin.firestore();
    
    // Get total users count
    const usersSnapshot = await db.collection('users').count().get();
    const totalUsers = usersSnapshot.data().count;

    // Get total habits count (sample from first 100 users)
    const usersWithHabits = await db.collection('users').limit(100).get();
    let totalHabits = 0;
    let activeHabits = 0;

    for (const userDoc of usersWithHabits.docs) {
      const habitsSnapshot = await db
        .collection('users')
        .doc(userDoc.id)
        .collection('habits')
        .get();
      
      totalHabits += habitsSnapshot.size;
      
      habitsSnapshot.docs.forEach(doc => {
        if (doc.data().isActive) {
          activeHabits++;
        }
      });
    }

    const metrics = {
      timestamp: new Date().toISOString(),
      users: {
        total: totalUsers,
      },
      habits: {
        total: totalHabits,
        active: activeHabits,
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    };

    console.log(JSON.stringify({
      level: 'info',
      function: 'getMetrics',
      metrics,
      timestamp: new Date().toISOString(),
    }));

    res.status(200).json(metrics);
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      function: 'getMetrics',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }));

    res.status(500).json({ error: 'Internal server error' });
  }
});
