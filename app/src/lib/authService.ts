
const CLIENT_ID = '775863607279-n39qdr1t0tcjvhortd7ke36oj5v04r9h.apps.googleusercontent.com'; // Production ID
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export interface UserProfile {
  name: string;
  picture: string;
  token: string;
}

export const AuthService = {
  login: () => {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', window.location.origin);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', SCOPES.join(' '));
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', 'pass-through-value');
    
    window.location.href = authUrl.toString();
  },

  handleCallback: (): UserProfile | null => {
    const hash = window.location.hash;
    if (!hash) return null;

    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    if (!token) return null;

    // In a real app, we would fetch the user profile here using the token
    // For now, we'll return a mock profile with the token
    return {
      name: 'YouTube User',
      picture: '',
      token: token
    };
  },

  saveUser: (user: UserProfile) => {
    localStorage.setItem('yt_music_user', JSON.stringify(user));
  },

  getUser: (): UserProfile | null => {
    const saved = localStorage.getItem('yt_music_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('yt_music_user');
    window.location.hash = '';
  }
};
