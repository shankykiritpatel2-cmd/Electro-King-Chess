/**
 * ELECTRO KING CHESS - FIREBASE CENTRAL BACKEND SERVICE
 * 
 * Production-ready Firebase integration:
 * - Firebase Authentication (Email/Password, Genuine Email Verification, Real Phone SMS OTP via Recaptcha, Google Sign-In, Password Reset)
 * - Cloud Firestore (Player Profiles, Points, Daily Puzzle Progress, Puzzle Streaks, Game Stats, Usernames Uniqueness)
 * - Firebase Analytics (Player Engagement, Puzzle Completion, Feature Usage)
 * - Offline-First Resilience (Gracefully falls back to local storage if offline or before domain verification)
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB99iLBFSPHLCHt4VKWMz_RRyG51JPkkmE",
    authDomain: "electrokingnew.firebaseapp.com",
    projectId: "electrokingnew",
    storageBucket: "electrokingnew.firebasestorage.app",
    messagingSenderId: "438419947496",
    appId: "1:438419947496:web:d5d2fac7b9ccbb69502e5d"
};

let fbApp = null;
let fbAuth = null;
let fbDb = null;
let fbAnalytics = null;
let fbPhoneConfirmationResult = null;
let fbRecaptchaVerifier = null;
let isFirebaseReady = false;

// Initialize Firebase with safety checks
function initFirebaseService() {
    try {
        if (typeof firebase !== 'undefined' && firebase.initializeApp) {
            if (!firebase.apps.length) {
                fbApp = firebase.initializeApp(FIREBASE_CONFIG);
            } else {
                fbApp = firebase.app();
            }
            fbAuth = firebase.auth();
            fbDb = firebase.firestore();
            
            // Enable offline persistence in Firestore where supported
            try {
                fbDb.enablePersistence({ synchronizeTabs: true }).catch(() => {});
            } catch (e) {}

            try {
                fbAnalytics = firebase.analytics();
            } catch (e) {
                console.log('Firebase Analytics initialized or waiting for cookie consent.');
            }

            isFirebaseReady = true;
            console.log('⚡ Electro King Firebase Service initialized successfully (Project: ' + FIREBASE_CONFIG.projectId + ')');
        } else {
            console.warn('⚠️ Firebase SDK scripts not loaded yet. Operating in local-sync mode.');
        }
    } catch (err) {
        console.error('⚠️ Firebase Initialization error:', err);
    }
}

// =========================================================
// 1. FIREBASE AUTHENTICATION SERVICES
// =========================================================

/**
 * Register a new user with Email, Password, Display Name, and Unique User ID
 */
async function fbRegisterWithEmail(email, password, displayName, userId) {
    if (!isFirebaseReady || !fbAuth) {
        throw new Error('Firebase Auth service is offline or initializing.');
    }

    const cleanUserId = userId.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUserId.length < 3) {
        throw new Error('User ID must be at least 3 characters (letters, numbers, underscores).');
    }

    // 1. Check if unique User ID is already taken in Firestore
    if (fbDb) {
        try {
            const usernameDoc = await fbDb.collection('usernames').doc(cleanUserId).get();
            if (usernameDoc.exists) {
                throw new Error('User ID @' + cleanUserId + ' is already taken. Please choose another.');
            }
        } catch (e) {
            if (e.message && e.message.includes('already taken')) throw e;
            console.warn('Could not verify username in Firestore (offline):', e);
        }
    }

    // 2. Create User in Firebase Authentication
    const userCredential = await fbAuth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // 3. Update Firebase Auth Profile
    await user.updateProfile({
        displayName: displayName
    });

    // 4. Send Genuine Email Verification
    try {
        await user.sendEmailVerification();
        console.log('📧 Verification email sent to ' + email);
    } catch (e) {
        console.warn('Email verification send warning:', e);
    }

    // 5. Initialize Profile Document in Cloud Firestore
    const now = new Date();
    const joinedStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const profileData = {
        uid: user.uid,
        userId: cleanUserId,
        showName: displayName,
        email: email,
        emailVerified: user.emailVerified,
        phone: '',
        phoneVerified: false,
        joinedDate: joinedStr,
        joinedTimestamp: now.getTime(),
        avatar: '👑',
        avatarUrl: '',
        rating: 1200,
        points: 250,
        matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        currentStreak: 0,
        bestStreak: 0,
        puzzles: 0,
        botRecords: { "1": { w: 0, l: 0, d: 0 }, "2": { w: 0, l: 0, d: 0 }, "3": { w: 0, l: 0, d: 0 }, "4": { w: 0, l: 0, d: 0 } },
        preferences: { theme: 'cyber', sound: true, vibration: true, coords: true, evalBar: true },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (fbDb) {
        try {
            // Write to users collection
            await fbDb.collection('users').doc(user.uid).set(profileData);
            // Reserve unique username in usernames collection
            await fbDb.collection('usernames').doc(cleanUserId).set({
                uid: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (dbErr) {
            console.warn('Firestore write warning:', dbErr);
        }
    }

    fbLogEvent('sign_up', { method: 'email', userId: cleanUserId });
    return { user, profileData };
}

/**
 * Sign in with Email and Password
 */
async function fbLoginWithEmail(email, password) {
    if (!isFirebaseReady || !fbAuth) {
        throw new Error('Firebase Auth service is offline or initializing.');
    }

    const userCredential = await fbAuth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Fetch user profile from Cloud Firestore
    let profileData = null;
    if (fbDb) {
        try {
            const doc = await fbDb.collection('users').doc(user.uid).get();
            if (doc.exists) {
                profileData = doc.data();
                // Update emailVerified flag if changed
                if (user.emailVerified && !profileData.emailVerified) {
                    profileData.emailVerified = true;
                    fbDb.collection('users').doc(user.uid).update({ emailVerified: true });
                }
            }
        } catch (e) {
            console.warn('Could not read user profile from Firestore:', e);
        }
    }

    fbLogEvent('login', { method: 'email' });
    return { user, profileData };
}

/**
 * Send Password Reset Email via Firebase
 */
async function fbSendPasswordReset(email) {
    if (!isFirebaseReady || !fbAuth) {
        throw new Error('Firebase Auth is offline.');
    }
    await fbAuth.sendPasswordResetEmail(email);
    fbLogEvent('password_reset_requested', { email });
    return true;
}

/**
 * Resend Email Verification link to active user
 */
async function fbResendEmailVerification() {
    if (!isFirebaseReady || !fbAuth || !fbAuth.currentUser) {
        throw new Error('No active user logged in.');
    }
    await fbAuth.currentUser.sendEmailVerification();
    return true;
}

/**
 * Send Real SMS OTP to a phone number using Firebase Phone Auth & RecaptchaVerifier
 */
async function fbSendPhoneOtp(phoneNumber, containerId = 'recaptcha-container') {
    if (!isFirebaseReady || !fbAuth) {
        throw new Error('Firebase Auth is offline.');
    }

    // Ensure invisible recaptcha verifier
    if (!fbRecaptchaVerifier) {
        fbRecaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
            size: 'invisible',
            callback: function(response) {
                console.log('Recaptcha resolved successfully for SMS OTP.');
            },
            'expired-callback': function() {
                console.warn('Recaptcha expired. Please try sending OTP again.');
            }
        });
        await fbRecaptchaVerifier.render();
    }

    fbPhoneConfirmationResult = await fbAuth.signInWithPhoneNumber(phoneNumber, fbRecaptchaVerifier);
    console.log('📲 Real SMS OTP dispatched to ' + phoneNumber);
    fbLogEvent('phone_otp_sent', { phone: phoneNumber });
    return fbPhoneConfirmationResult;
}

/**
 * Verify Real SMS OTP Code received on phone
 */
async function fbVerifyPhoneOtp(otpCode) {
    if (!fbPhoneConfirmationResult) {
        throw new Error('No SMS verification in progress. Please request an SMS code first.');
    }

    const userCredential = await fbPhoneConfirmationResult.confirm(otpCode);
    const user = userCredential.user;

    // Update phone & phoneVerified status in Firestore
    if (fbDb && user) {
        try {
            await fbDb.collection('users').doc(user.uid).set({
                phone: user.phoneNumber || '',
                phoneVerified: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.warn('Could not update phone verification in Firestore:', e);
        }
    }

    fbLogEvent('phone_otp_verified', { uid: user.uid });
    return user;
}

/**
 * Sign in with Google (Web & Android compatible)
 */
async function fbSignInWithGoogle() {
    if (!isFirebaseReady || !fbAuth) {
        throw new Error('Firebase Auth is offline.');
    }

    // On Android WebView with AndroidBridge, use native Google Sign In
    if (window.AndroidBridge && typeof window.AndroidBridge.signInWithGoogle === 'function') {
        window.AndroidBridge.signInWithGoogle();
        return { isAndroidNative: true };
    }

    // On Web, use Firebase Popup / Redirect
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const result = await fbAuth.signInWithPopup(provider);
    const user = result.user;

    // Sync / create profile in Firestore
    let profileData = null;
    if (fbDb && user) {
        try {
            const userRef = fbDb.collection('users').doc(user.uid);
            const doc = await userRef.get();
            if (doc.exists) {
                profileData = doc.data();
            } else {
                const defaultUid = (user.email ? user.email.split('@')[0] : 'player').toLowerCase().replace(/[^a-z0-9_]/g, '');
                const now = new Date();
                const joinedStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                profileData = {
                    uid: user.uid,
                    userId: defaultUid,
                    showName: user.displayName || 'Electro Player',
                    email: user.email || '',
                    emailVerified: user.emailVerified,
                    phone: user.phoneNumber || '',
                    phoneVerified: !!user.phoneNumber,
                    joinedDate: joinedStr,
                    joinedTimestamp: now.getTime(),
                    avatar: '👑',
                    avatarUrl: user.photoURL || '',
                    rating: 1200,
                    points: 250,
                    matches: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    currentStreak: 0,
                    bestStreak: 0,
                    puzzles: 0,
                    botRecords: { "1": { w: 0, l: 0, d: 0 }, "2": { w: 0, l: 0, d: 0 }, "3": { w: 0, l: 0, d: 0 }, "4": { w: 0, l: 0, d: 0 } },
                    preferences: { theme: 'cyber', sound: true, vibration: true, coords: true, evalBar: true },
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await userRef.set(profileData);
                await fbDb.collection('usernames').doc(defaultUid).set({
                    uid: user.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (e) {
            console.warn('Google sign-in Firestore sync error:', e);
        }
    }

    fbLogEvent('login', { method: 'google' });
    return { user, profileData };
}

/**
 * Sign Out from Firebase
 */
async function fbSignOut() {
    if (isFirebaseReady && fbAuth) {
        await fbAuth.signOut();
    }
    if (window.AndroidBridge && typeof window.AndroidBridge.signOutGoogle === 'function') {
        window.AndroidBridge.signOutGoogle();
    }
    fbLogEvent('sign_out');
}

// =========================================================
// 2. CLOUD FIRESTORE DATA SYNCHRONIZATION
// =========================================================

/**
 * Save / Update Player Profile in Firestore
 */
async function fbSaveProfile(profile) {
    if (!isFirebaseReady || !fbDb || !fbAuth || !fbAuth.currentUser) {
        return false;
    }
    try {
        const uid = fbAuth.currentUser.uid;
        await fbDb.collection('users').doc(uid).set({
            showName: profile.name || 'Player',
            avatar: profile.avatar || '👑',
            avatarUrl: profile.avatarUrl || '',
            rating: profile.rating || 1200,
            points: profile.points || 0,
            matches: profile.matches || 0,
            wins: profile.wins || 0,
            losses: profile.losses || 0,
            draws: profile.draws || 0,
            currentStreak: profile.currentStreak || 0,
            bestStreak: profile.bestStreak || 0,
            puzzles: profile.puzzles || 0,
            botRecords: profile.botRecords || {},
            preferences: profile.preferences || undefined,
            consent: profile.consent || undefined,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
    } catch (e) {
        console.warn('Cloud Firestore saveProfile error (saved locally):', e);
        return false;
    }
}

/**
 * Save Player Preferences (including theme) to Cloud Firestore
 */
async function fbSavePreferences(prefs) {
    if (!isFirebaseReady || !fbDb || !fbAuth || !fbAuth.currentUser) {
        return false;
    }
    try {
        const uid = fbAuth.currentUser.uid;
        await fbDb.collection('users').doc(uid).set({
            preferences: prefs,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Submit Contact Us Support Message to Cloud Firestore
 */
async function fbSubmitContactMessage(payload) {
    if (!isFirebaseReady || !fbDb) {
        throw new Error('Firebase service is offline. Please try again when connected.');
    }
    const docData = {
        name: String(payload.name || '').trim(),
        email: String(payload.email || '').trim(),
        subject: String(payload.subject || '').trim(),
        message: String(payload.message || '').trim(),
        uid: (fbAuth && fbAuth.currentUser) ? fbAuth.currentUser.uid : 'guest',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await fbDb.collection('contactMessages').add(docData);
    fbLogEvent('contact_form_submitted', { messageId: docRef.id });
    return docRef.id;
}

/**
 * Save Daily Puzzle Completion for Today
 */
async function fbSaveDailyPuzzle(dateStr, completedIndices, pointsEarned) {
    if (!isFirebaseReady || !fbDb || !fbAuth || !fbAuth.currentUser) {
        return false;
    }
    try {
        const uid = fbAuth.currentUser.uid;
        await fbDb.collection('users').doc(uid).collection('dailyPuzzles').doc(dateStr).set({
            completed: completedIndices,
            pointsEarned: pointsEarned || 0,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (e) {
        console.warn('Could not save daily puzzle to Firestore:', e);
        return false;
    }
}

/**
 * Load Daily Puzzle Completion for Today from Firestore
 */
async function fbLoadDailyPuzzle(dateStr) {
    if (!isFirebaseReady || !fbDb || !fbAuth || !fbAuth.currentUser) {
        return null;
    }
    try {
        const uid = fbAuth.currentUser.uid;
        const doc = await fbDb.collection('users').doc(uid).collection('dailyPuzzles').doc(dateStr).get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Save Puzzle Streak Data to Firestore
 */
async function fbSavePuzzleStreak(streak, lastDate) {
    if (!isFirebaseReady || !fbDb || !fbAuth || !fbAuth.currentUser) {
        return false;
    }
    try {
        const uid = fbAuth.currentUser.uid;
        await fbDb.collection('users').doc(uid).collection('puzzleStreaks').doc('current').set({
            streak: streak || 0,
            lastDate: lastDate || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Load Puzzle Streak Data from Firestore
 */
async function fbLoadPuzzleStreak() {
    if (!isFirebaseReady || !fbDb || !fbAuth || !fbAuth.currentUser) {
        return null;
    }
    try {
        const uid = fbAuth.currentUser.uid;
        const doc = await fbDb.collection('users').doc(uid).collection('puzzleStreaks').doc('current').get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    } catch (e) {
        return null;
    }
}

// =========================================================
// 3. FIREBASE ANALYTICS TRACKING
// =========================================================

function fbLogEvent(eventName, params = {}) {
    try {
        if (fbAnalytics && typeof fbAnalytics.logEvent === 'function') {
            fbAnalytics.logEvent(eventName, params);
        }
    } catch (e) {}
}

// Automatically initialize when DOM loads
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', initFirebaseService);
}
