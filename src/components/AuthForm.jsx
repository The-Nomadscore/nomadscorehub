// AuthForm.jsx — the email + password form for both /login and /register.
//
// Props:
//   mode      'login' | 'register'
//   onSubmit  (email, password) => Promise. Should throw on failure; the
//             thrown ApiError (see services/api.js) is turned into messages here.
//   notice    optional node shown above the fields (e.g. "session expired")
//   footer    optional node shown under the button (e.g. a link to the other page)

import { useEffect, useState } from 'react';

const inputClass =
  'w-full bg-brand-bg border border-brand-border rounded-card px-4 py-2 text-sm text-brand-text ' +
  'placeholder:text-brand-muted focus:outline-none focus:border-brand-accent disabled:opacity-60';

const COPY = {
  login: {
    title: 'Welcome back',
    submit: 'Sign in',
    busy: 'Signing in…',
    passwordAutoComplete: 'current-password',
  },
  register: {
    title: 'Create your account',
    submit: 'Create account',
    busy: 'Creating account…',
    passwordAutoComplete: 'new-password',
  },
};

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

// Turns an ApiError into { fields } (shown under inputs) or { form } (shown at the top).
function describeError(err) {
  const fields = err?.details?.fields;
  if (err?.code === 'validation_error' && fields) return { fields };
  if (err?.code === 'email_taken') {
    return { fields: { email: 'An account with this email already exists. Try signing in.' } };
  }
  if (err?.status == null) {
    return { form: "Can't reach the server. Check your connection and try again." };
  }
  // invalid_credentials arrives with the server's own wording.
  return { form: err.message || 'Something went wrong. Try again.' };
}

function AuthForm({ mode, onSubmit, notice = null, footer = null }) {
  const copy = COPY[mode];
  const isRegister = mode === 'register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);

  // The free hosting plan puts the API to sleep; the first request can take
  // up to a minute. After 4 seconds, tell the user why nothing is happening.
  useEffect(() => {
    if (!submitting) {
      setSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, [submitting]);

  function validate() {
    const found = {};
    if (!email.trim()) found.email = 'Enter your email address.';
    if (!password) {
      found.password = 'Enter your password.';
    } else if (isRegister && (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX)) {
      found.password = `Use ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.`;
    }
    return found;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const found = validate();
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(email.trim(), password);
      // On success the page navigates away, so nothing else to do here.
    } catch (err) {
      const described = describeError(err);
      setErrors(described.fields ?? {});
      setFormError(described.form ?? null);
      setSubmitting(false);
    }
  }

  const emailId = `${mode}-email`;
  const passwordId = `${mode}-password`;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={submitting}
      className="bg-brand-surface border border-brand-border rounded-card p-6 sm:p-8 space-y-5 w-full max-w-md"
    >
      <h1 className="font-display text-2xl text-brand-text">{copy.title}</h1>

      {notice}

      {formError && (
        <p
          role="alert"
          className="border border-brand-danger/40 bg-brand-danger/10 text-brand-text rounded-card px-4 py-3 text-sm"
        >
          {formError}
        </p>
      )}

      <div>
        <label htmlFor={emailId} className="block text-sm text-brand-muted mb-1">
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          className={inputClass}
        />
        {errors.email && (
          <p id={`${emailId}-error`} className="text-brand-danger text-xs mt-1">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={passwordId} className="block text-sm text-brand-muted mb-1">
          Password
        </label>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete={copy.passwordAutoComplete}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? `${passwordId}-error` : isRegister ? `${passwordId}-hint` : undefined
          }
          className={inputClass}
        />
        {errors.password ? (
          <p id={`${passwordId}-error`} className="text-brand-danger text-xs mt-1">
            {errors.password}
          </p>
        ) : (
          isRegister && (
            <p id={`${passwordId}-hint`} className="text-brand-muted text-xs mt-1">
              {PASSWORD_MIN} to {PASSWORD_MAX} characters.
            </p>
          )
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-5 py-2 rounded-pill bg-brand-accent text-brand-bg font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {submitting ? copy.busy : copy.submit}
      </button>

      {slow && (
        <p role="status" className="text-brand-muted text-xs">
          The server may be waking up. The first request can take up to a minute.
        </p>
      )}

      {footer}
    </form>
  );
}

export default AuthForm;