import { useState } from "react";
import { login } from "../services/api";
import { t } from '../i18n/translations'

export default function Login({ setToken, language }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError(t('pleaseEnterBoth', language));
      return;
    }

    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      if (data && data.token) {
        const user = data.user || { username: email.trim(), email: email.trim() };
        localStorage.setItem('user', JSON.stringify(user));
        setToken(data.token, user);
      } else {
        setError(t('loginFailed', language));
      }
    } catch (e) {
      setError(e.message || t('invalidCredentials', language));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setError(t('googleNotConfigured', language));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  return (
    <>
      <div className="auth-form">
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">{t('email', language)}</label>
          <input
            className="form-input"
            type="email"
            placeholder={t('yourEmail', language)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('password', language)}</label>
          <input
            className="form-input"
            type="password"
            placeholder={t('password', language)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="auth-btn"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('signingIn', language)}
            </span>
          ) : (
            t('signInButton', language)
          )}
        </button>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <button onClick={handleGoogle} className="google-btn">
          <svg viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.9 0 6.7 1.7 8.3 3.1l6-5.9C34.9 4 30.8 2.5 24 2.5 14.8 2.5 7.3 7.8 4 15.3l7.1 5.5C12.1 15.1 17.6 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.2-.6-4.7H24v9.1h12.6c-.5 2.8-2.1 5.2-4.5 6.8l7.1 5.5c4.2-3.9 6.3-9.6 6.3-16.7z" />
            <path fill="#FBBC05" d="M11.1 29.7c-.9-2.6-.9-5.5 0-8.1L4 15.3c-2.8 5.6-2.8 12.3 0 17.9l7.1-3.5z" />
            <path fill="#34A853" d="M24 46.5c6.2 0 11.4-2 15.2-5.4l-7.1-5.5c-2 1.4-4.6 2.3-8.1 2.3-6.4 0-11.9-5.6-12.9-12.7L4 32.3C7.3 39.8 14.8 45 24 45z" />
          </svg>
          Continue with Google
        </button>
      </div>

      <div className="auth-footer">
        New here? <a href="#/register">{t('registerPrompt', language)}</a>
      </div>
    </>
  )
}
