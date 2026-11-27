/**
 * ELECTRO KING CHESS - FIREBASE CENTRAL BACKEND SERVICE
 * 
 * Production-ready Firebase integration:
 * - Firebase Authentication (Email/Password, Genuine Email Verification, Real Phone SMS OTP via Recaptcha, Google Sign-In with Popup + Redirect fallback, Password Reset, Credential Linking)
 * - Cloud Firestore (Player Profiles, Points, Daily Puzzle Progress, Puzzle Streaks, Game Stats, Preferences, Usernames Uniqueness, Contact Support)
 * - Firebase Analytics (Player Engagement, Puzzle Completion, Feature Usage)
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB99iLBFSPHLCHt4VKWMz_RRyG51JPkkmE",
    authDomain: "electrokingnew.firebaseapp.com",
    projectId: "electrokingnew",
    storageBucket: "electrokingnew.firebasestorage.app",
    messagingSenderId: "438419947496",
    appId: "1:438419947496:web:6af93080b2e124c8502e5d"
};

let fbApp = null;
let fbAuth = null;
let fbDb = null;
let fbAnalytics = null;
let fbPhoneConfirmationResult = null;
let fbRecaptchaVerifier = null;
let isFirebaseReady = false;

/**
 * Maps Firebase technical error codes to clear, user-friendly diagnostics
 * while always logging the full technical details to the browser console.
 */
function formatFirebaseAuthError(err) {
    if (!err) return 'Unknown authentication error.';
    console.error('[Firebase Auth Error]', err.code || 'no-code', err.message || err);
    const code = err.code || '';
    switch (code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Incorrect email or password. Please check your credentials and try again.';
        case 'auth/user-not-found':
            return 'Account not found. Please check your email/User ID or create a new account.';
        case 'auth/email-already-in-use':
            return 'This email address is already registered. Please use Switch Device / Login.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.';
        case 'auth/invalid-phone-number':
            return 'Invalid phone number format. Include country code (e.g. +919823955519).';
        case 'auth/invalid-verification-code':
            return 'Incorrect SMS OTP code. Please check the code in your Messages app.';
        case 'auth/code-expired':
            return 'SMS OTP code expired. Please request a new OTP.';
        case 'auth/missing-verification-code':
            return 'Please enter the 6-digit SMS OTP code.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a few minutes and try again.';
        case 'auth/network-request-failed':
            return 'Network connection error. Please check your internet connection.';
        case 'auth/unauthorized-domain':
            return `Domain "${window.location.hostname}" is not authorized in Firebase Console → Authentication → Settings → Authorized domains.`;
        case 'auth/configuration-not-found':
            return 'Firebase Authentication provider is not configured/enabled in Firebase Console (project: electrokingnew).';
        case 'auth/operation-not-allowed':
            return 'This sign-in provider is disabled in Firebase Console → Authentication → Sign-in method.';
        case 'auth/billing-not-enabled':
            return 'Firebase Phone SMS OTP requires Blaze billing or configured test phone numbers in Firebase Console.';
        case 'auth/popup-blocked':
            return 'Sign-in popup was blocked by your browser. Redirecting to Google...';
        case 'auth/popup-closed-by-user':
            return 'Google Sign-In popup was closed before completing sign-in.';
        case 'auth/credential-already-in-use':
            return 'This phone number or credential is already linked to another account.';
        default:
            return err.message || 'Authentication failed. Please try again.';
    }
}

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

            try {
                fbDb.enablePersistence({ synchronizeTabs: true }).catch(() => {});
            } catch (e) {}

            try {
                fbAnalytics = firebase.analytics();
            } catch (e) {
                console.log('Firebase Analytics waiting for initialization.');
            }

            isFirebaseReady = true;
            console.log('⚡ Electro King Firebase Service initialized (Project: ' + FIREBASE_CONFIG.projectId + ')');
        } else {
            console.warn('⚠️ Firebase SDK scripts not loaded yet.');
        }
    } catch (err) {
        console.error('⚠️ Firebase Initialization error:', err);
    }
}

/**
 * Merges guest stats/progress into a newly created profile so guest progress is preserved.
 */
function buildNewProfileData(uid, baseInfo, guestSnapshot = null) {
    const now = new Date();
    const joinedStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const g = guestSnapshot || {};
    return {
        uid: uid,
        userId: baseInfo.userId,
        showName: baseInfo.showName || g.name || 'Electro Player',
        email: baseInfo.email || '',
        emailVerified: !!baseInfo.emailVerified,
        phone: baseInfo.phone || '',
        phoneVerified: !!baseInfo.phoneVerified,
        joinedDate: joinedStr,
        joinedTimestamp: now.getTime(),
        avatar: g.avatar || '👑',
        avatarUrl: baseInfo.avatarUrl || g.avatarUrl || '',
        rating: g.rating && g.rating !== 1200 ? g.rating : 1200,
        points: Math.max(250, g.points || 0),
        matches: g.matches || 0,
        wins: g.wins || 0,
        losses: g.losses || 0,
        draws: g.draws || 0,
        currentStreak: g.currentStreak || 0,
        bestStreak: g.bestStreak || 0,
        puzzles: g.puzzles || 0,
        botRecords: g.botRecords || { "1": { w: 0, l: 0, d: 0 }, "2": { w: 0, l: 0, d: 0 }, "3": { w: 0, l: 0, d: 0 }, "4": { w: 0, l: 0, d: 0 } },
        preferences: baseInfo.preferences || { theme: 'cyber', sound: true, vibration: true, coords: true, evalBar: true },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
}

// =========================================================
// 1. FIREBASE AUTHENTICATION SERVICES
// =========================================================

/**
 * Register a new user with Email, Password, Display Name, and Unique User ID.
 * If user already signed in via Phone OTP during registration, links Email+Password
 * to that exact same Firebase UID instead of creating a duplicate account.
 */
async function fbRegisterWithEmail(email, password, displayName, userId, phone = '', phoneVerified = false, guestSnapshot = null) {
    if (!isFirebaseReady || !fbAuth) {
        throw new Error('Firebase Auth service is offline or initializing.');
    }

    const cleanUserId = userId.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUserId.length < 3) {
        throw new Error('User ID must be at least 3 characters (letters, numbers, underscores).');
    }

    // 1. Check if unique User ID is already taken in Firestore
    if (fbDb) {
        const usernameDoc = await fbDb.collection('usernames').doc(cleanUserId).get();
        if (usernameDoc.exists) {
            throw new Error('User ID @' + cleanUserId + ' is already taken. Please choose another.');
        }
    }

    let user = null;
    // 2. If user just verified their phone via Firebase Phone Auth, link Email+Password to the SAME UID!
    if (fbAuth.currentUser && fbAuth.currentUser.phoneNumber && !fbAuth.currentUser.email) {
        const emailCred = firebase.auth.EmailAuthProvider.credential(email, password);
        const linkedCred = await fbAuth.currentUser.linkWithCredential(emailCred);
        user = linkedCred.user;
    } else {
        const userCredential = await fbAuth.createUserWithEmailAndPassword(email, password);
        user = userCredential.user;
    }

    // 3. Update Firebase Auth Profile
    await user.updateProfile({ displayName: displayName });

    // 4. Send Genuine Email Verification
    try {
        await user.sendEmailVerification();
        console.log('📧 Genuine verification email sent to ' + email);
    } catch (e) {
        console.warn('Email verification send warning:', e);
    }

    // 5. Initialize Profile Document in Cloud Firestore (preserving guest progress)
    const profileData = buildNewProfileData(user.uid, {
        userId: cleanUserId,
        showName: displayName,
        email: email,
        emailVerified: user.emailVerified,
        phone: user.phoneNumber || phone || '',
        phoneVerified: !!(user.phoneNumber || phoneVerified)
    }, guestSnapshot);

    if (fbDb) {
        await fbDb.collection('users').doc(user.uid).set(profileData, { merge: true });
        await fbDb.collection('usernames').doc(cleanUserId).set({
            uid: user.uid,
            email: email.toLowerCase(),
            phone: user.phoneNumber || phone || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
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
        const doc = await fbDb.collection('users').doc(user.uid).get();
        if (doc.exists) {
            profileData = doc.data();
            if (user.emailVerified && !profileData.emailVerified) {
                profileData.emailVerified = true;
                fbDb.collection('users').doc(user.uid).update({ emailVerified: true }).catch(() => {});
            }
        } else {
            const fallbackId = (user.email ? user.email.split('@')[0] : 'player').toLowerCase().replace(/[^a-z0-9_]/g, '');
            profileData = buildNewProfileData(user.uid, {
                userId: fallbackId,
                showName: user.displayName || 'Electro Player',
                email: user.email || '',
                emailVerified: user.emailVerified,
                phone: user.phoneNumber || '',
                phoneVerified: !!user.phoneNumber
            });
            await fbDb.collection('users').doc(user.uid).set(profileData, { merge: true });
        }
    }

    fbLogEvent('login', { method: 'email' });
    return { user, profileData };
}

/**
 * Sign in with User ID via secure Firestore username -> email lookup (never exposes passwords)
 */
async function fbLoginWithUserId(userId, password) {
    if (!isFirebaseReady || !fbDb || !fbAuth) {
        throw new Error('Firebase Auth service is offline or initializing.');
    }
    const cleanUserId = userId.toLowerCase().trim().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    if (cleanUserId.length < 3) {
        throw new Error('Please enter a valid User ID.');
    }
    const usernameDoc = await fbDb.collection('usernames').doc(cleanUserId).get();
    if (!usernameDoc.exists) {
        throw new Error('User ID @' + cleanUserId + ' was not found.');
    }
    const data = usernameDoc.data();
    if (!data || !data.email) {
        throw new Error('This User ID uses Phone or Google login. Please sign in with your Phone Number or Google.');
    }
    return await fbLoginWithEmail(data.email, password);
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

    // Normalize E.164 format
    let formattedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
    if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
    }

    if (fbRecaptchaVerifier) {
        try { fbRecaptchaVerifier.clear(); } catch (e) {}
        fbRecaptchaVerifier = null;
    }

    fbRecaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
        size: 'invisible',
        callback: function() {
            console.log('Recaptcha resolved successfully for SMS OTP.');
        },
        'expired-callback': function() {
            console.warn('Recaptcha expired. Please try sending OTP again.');
        }
    });
    await fbRecaptchaVerifier.render();

    fbPhoneConfirmationResult = await fbAuth.signInWithPhoneNumber(formattedPhone, fbRecaptchaVerifier);
    console.log('📲 Real SMS OTP dispatched to ' + formattedPhone);
    fbLogEvent('phone_otp_sent', { phone: formattedPhone });
    return fbPhoneConfirmationResult;
}

/**
 * Verify Real SMS OTP Code received on phone and load/merge Firestore profile
 */
async function fbVerifyPhoneOtp(otpCode, guestSnapshot = null) {
    if (!fbPhoneConfirmationResult) {
        throw new Error('No SMS verification in progress. Please request an SMS code first.');
    }

    const userCredential = await fbPhoneConfirmationResult.confirm(otpCode);
    const user = userCredential.user;
    let profileData = null;

    if (fbDb && user) {
        const userRef = fbDb.collection('users').doc(user.uid);
        const doc = await userRef.get();
        if (doc.exists) {
            profileData = doc.data();
            if (!profileData.phoneVerified) {
                profileData.phoneVerified = true;
                profileData.phone = user.phoneNumber || profileData.phone || '';
                await userRef.set({
                    phone: profileData.phone,
                    phoneVerified: true,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
        } else {
            const digits = (user.phoneNumber || '').replace(/\D/g, '').slice(-6) || 'player';
            profileData = buildNewProfileData(user.uid, {
                userId: 'player_' + digits,
                showName: (guestSnapshot && guestSnapshot.name && guestSnapshot.name !== 'Guest Player') ? guestSnapshot.name : 'Electro Player',
                email: user.email || '',
                emailVerified: !!user.emailVerified,
                phone: user.phoneNumber || '',
                phoneVerified: true
            }, guestSnapshot);
            await userRef.set(profileData, { merge: true });
        }
    }

    fbLogEvent('phone_otp_verified', { uid: user.uid });
    return { user, profileData };
}

/**
 * Helper to sync or create Firestore profile after Google Sign-In
 */
async function syncGoogleUserToFirestore(user, guestSnapshot = null) {
    if (!fbDb || !user) return null;
    const userRef = fbDb.collection('users').doc(user.uid);
    const doc = await userRef.get();
    if (doc.exists) {
        return doc.data();
    }
    const baseUid = (user.email ? user.email.split('@')[0] : 'player').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18) || 'player';
    let finalUid = baseUid;
    try {
        const existingUname = await fbDb.collection('usernames').doc(finalUid).get();
        if (existingUname.exists) {
            finalUid = baseUid + '_' + user.uid.slice(0, 4).toLowerCase();
        }
    } catch (e) {}

    const profileData = buildNewProfileData(user.uid, {
        userId: finalUid,
        showName: user.displayName || 'Electro Player',
        email: user.email || '',
        emailVerified: user.emailVerified,
        phone: user.phoneNumber || '',
        phoneVerified: !!user.phoneNumber,
        avatarUrl: user.photoURL || ''
    }, guestSnapshot);

    await userRef.set(profileData, { merge: true });
    await fbDb.collection('usernames').doc(finalUid).set({
        uid: user.uid,
        email: (user.email || '').toLowerCase(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return profileData;
}

/**
 * Sign in with Google (Web Popup with Redirect fallback, and Android Native Bridge)
 */
async function fbSignInWithGoogle(guestSnapshot = null) {
    if (!isFirebaseReady || !fbAuth) {
        throw new Error('Firebase Auth is offline.');
    }

    // On Android WebView with AndroidBridge, use native Google Sign-In
    if (window.AndroidBridge && typeof window.AndroidBridge.signInWithGoogle === 'function') {
        window.AndroidBridge.signInWithGoogle();
        return { isAndroidNative: true };
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
        const result = await fbAuth.signInWithPopup(provider);
        const user = result.user;
        const profileData = await syncGoogleUserToFirestore(user, guestSnapshot);
        fbLogEvent('login', { method: 'google' });
        return { user, profileData };
    } catch (err) {
        // Fallback to signInWithRedirect if popup is blocked or fails in restrictive browser environments
        if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request')) {
            console.warn('Google popup blocked/cancelled, switching to signInWithRedirect...');
            await fbAuth.signInWithRedirect(provider);
            return { redirecting: true };
        }
        throw err;
    }
}

/**
 * Check for pending Google Sign-In redirect result on page load
 */
async function fbCheckGoogleRedirectResult(guestSnapshot = null) {
    if (!isFirebaseReady || !fbAuth) return null;
    try {
        const result = await fbAuth.getRedirectResult();
        if (result && result.user) {
            const profileData = await syncGoogleUserToFirestore(result.user, guestSnapshot);
            fbLogEvent('login', { method: 'google_redirect' });
            return { user: result.user, profileData };
        }
    } catch (err) {
        console.error('[Google Redirect Error]', err);
        throw err;
    }
    return null;
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

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', initFirebaseService);
}
