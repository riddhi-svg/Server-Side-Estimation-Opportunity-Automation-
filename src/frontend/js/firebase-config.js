// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

// Your web app's Firebase configuration loaded from environment
export const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) || '',
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || '',
  projectId: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID) || '',
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || '',
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || '',
  appId: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_APP_ID) || ''
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with required scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/tagmanager.readonly');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

const TOKEN_STORAGE_KEY = 'gtm_oauth_access_token';

export function getStoredAccessToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredAccessToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function clearStoredAccessToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Auto-redirects to Google Login using Firebase Redirect flow.
 * Avoids Cross-Origin-Opener-Policy (COOP) and popup blocking issues.
 */
export async function redirectToGoogleLogin() {
  try {
    console.log('Redirecting to Google login...');
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Redirect sign-in error:', error);
  }
}

/**
 * Initiates login directly via redirect flow.
 */
export async function loginWithGoogle() {
  await redirectToGoogleLogin();
}

export async function logoutUser() {
  clearStoredAccessToken();
  await signOut(auth);
  console.log('👋 User logged out.');
}

/**
 * Wrapper for API calls to GTM endpoints.
 * In case the OAuth token expires (401 response),
 * automatically redirects to login rather than showing error.
 */
export async function gtmFetch(url, options = {}) {
  const token = getStoredAccessToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      console.warn('OAuth token expired or unauthorized (401 response). Auto-redirecting to login...');
      clearStoredAccessToken();
      await redirectToGoogleLogin();
      return null;
    }

    return response;
  } catch (err) {
    console.error('Network error during GTM fetch:', err);
    throw err;
  }
}

/**
 * Checks for redirect login results upon page load and registers auth state listener.
 */
export async function setupAuth(onStateChange) {
  try {
    // Handle return from redirect login
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult) {
      const credential = GoogleAuthProvider.credentialFromResult(redirectResult);
      if (credential && credential.accessToken) {
        setStoredAccessToken(credential.accessToken);
        console.log('✅ User successfully logged in via redirect:', {
          displayName: redirectResult.user.displayName,
          email: redirectResult.user.email,
          uid: redirectResult.user.uid,
          photoURL: redirectResult.user.photoURL
        });
      }
    }
  } catch (error) {
    console.error('Error handling redirect login result:', error);
  }

  // Subscribe to Firebase Auth state
  onAuthStateChanged(auth, async (user) => {
    const token = getStoredAccessToken();
    if (user && token) {
      console.log('✅ Auth state: User is authenticated:', {
        displayName: user.displayName,
        email: user.email,
        uid: user.uid
      });
      if (onStateChange) onStateChange({ isAuthenticated: true, user, token });
    } else if (user && !token) {
      if (onStateChange) onStateChange({ isAuthenticated: true, user, token: null });
    } else {
      if (onStateChange) onStateChange({ isAuthenticated: false, user: null, token: null });
    }
  });
}
