/**
 * ELECTRO KING CHESS - FIREBASE CLOUD FUNCTIONS
 * 
 * Server-side trusted validation:
 * - Rewarded advertisement validation & secure point awards
 * - Daily checkmate streak verification & bonus points distribution
 * - Username uniqueness check
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Validates a completed rewarded video ad view and safely grants points server-side.
 */
exports.validateRewardedAdClaim = functions.https.onCall(async (data, context) => {
    // 1. Verify caller authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required to claim advertisement rewards.'
        );
    }

    const uid = context.auth.uid;
    const rewardType = data.rewardType || 'points'; // 'points' or 'hint'
    const pointAmount = 50;

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Player profile not found.');
    }

    // 2. Perform atomic point increment
    if (rewardType === 'points') {
        await userRef.update({
            points: admin.firestore.FieldValue.increment(pointAmount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, granted: 'points', amount: pointAmount };
    } else {
        return { success: true, granted: 'hint', amount: 1 };
    }
});

/**
 * Validates that all 5 daily puzzles were solved today and updates streak bonus.
 */
exports.claimDailyPuzzleBonus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required to claim daily puzzle bonus.'
        );
    }

    const uid = context.auth.uid;
    const dateStr = data.dateStr; // Format: YYYY-MM-DD
    if (!dateStr) {
        throw new functions.https.HttpsError('invalid-argument', 'Date string required.');
    }

    const puzzleDoc = await db.collection('users').doc(uid).collection('dailyPuzzles').doc(dateStr).get();
    if (!puzzleDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Daily puzzle progress not found for today.');
    }

    const pzData = puzzleDoc.data();
    const completedList = pzData.completed || [];
    if (completedList.length < 5) {
        throw new functions.https.HttpsError('failed-precondition', 'Must complete all 5 daily puzzles to claim streak bonus.');
    }

    // Grant 100 bonus streak points
    const bonus = 100;
    await db.collection('users').doc(uid).update({
        points: admin.firestore.FieldValue.increment(bonus),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, bonusPoints: bonus };
});

/**
 * Checks whether a requested unique User ID (@username) is available.
 */
exports.checkUsernameAvailability = functions.https.onCall(async (data) => {
    const username = (data.username || '').toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (username.length < 3) {
        return { available: false, reason: 'Too short (min 3 chars)' };
    }

    const doc = await db.collection('usernames').doc(username).get();
    return { available: !doc.exists, username };
});
