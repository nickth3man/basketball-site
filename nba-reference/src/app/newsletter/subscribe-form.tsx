'use client';

/**
 * @fileoverview Newsletter subscription form client component.
 *
 * Renders the email input + subscribe button and handles the POST to
 * /api/newsletter/subscribe. Uses React state for feedback display.
 *
 * @module @/app/newsletter/subscribe-form
 */

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'already' | 'error';

interface ErrorApiPayload {
  error: { code: string; message: string };
}

interface OkApiPayload {
  status: 'subscribed' | 'already_subscribed';
  unsubscribe_token: string;
}

type SubscribeApiPayload = OkApiPayload | ErrorApiPayload;

function isErrorPayload(payload: SubscribeApiPayload): payload is ErrorApiPayload {
  return 'error' in payload;
}

/**
 * Email subscription form that POSTs to the subscribe API endpoint.
 *
 * Shows inline feedback for loading, success, already-subscribed, and error states.
 */
export function SubscribeForm(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [preference, setPreference] = useState<'daily' | 'weekly'>('daily');
  const [status, setStatus] = useState<SubscribeStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), preference, source: 'newsletter_page' }),
      });

      const data = (await res.json()) as SubscribeApiPayload;

      if (!res.ok || isErrorPayload(data)) {
        const msg = isErrorPayload(data)
          ? data.error.message
          : 'Something went wrong. Please try again.';
        setErrorMsg(msg);
        setStatus('error');
        return;
      }

      setStatus(data.status === 'already_subscribed' ? 'already' : 'success');
    } catch {
      setErrorMsg('Network error — please check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="surface-pedestal rounded-xl p-6 text-center" role="status">
        <p className="text-lg font-semibold text-heading">You&apos;re in! 🎉</p>
        <p className="mt-2 text-sm text-muted">
          Check your inbox each morning for last night&apos;s NBA recap.
        </p>
      </div>
    );
  }

  if (status === 'already') {
    return (
      <div className="surface-pedestal rounded-xl p-6 text-center" role="status">
        <p className="text-lg font-semibold text-heading">Already subscribed</p>
        <p className="mt-2 text-sm text-muted">
          You&apos;re already on the list — look out for tomorrow morning&apos;s edition!
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={e => {
        void handleSubmit(e);
      }}
      noValidate
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          name="email"
          id="newsletter-email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          aria-label="Email address"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
          }}
          className="flex-1"
          disabled={status === 'loading'}
        />
        <Button
          type="submit"
          variant="heroCta"
          size="lg"
          disabled={status === 'loading' || email.trim().length === 0}
        >
          {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
        </Button>
      </div>

      {/* Frequency preference */}
      <fieldset className="flex items-center gap-4 text-sm text-muted">
        <legend className="sr-only">Newsletter frequency</legend>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="radio"
            name="preference"
            value="daily"
            checked={preference === 'daily'}
            onChange={() => {
              setPreference('daily');
            }}
            className="accent-[var(--dc-tertiary)]"
          />
          Daily recap
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="radio"
            name="preference"
            value="weekly"
            checked={preference === 'weekly'}
            onChange={() => {
              setPreference('weekly');
            }}
            className="accent-[var(--dc-tertiary)]"
          />
          Weekly digest
        </label>
      </fieldset>

      {status === 'error' && (
        <p role="alert" className="text-sm text-[var(--dc-secondary)]">
          {errorMsg}
        </p>
      )}

      <p className="text-xs text-muted">
        No spam. Unsubscribe any time via the link in every email.
      </p>
    </form>
  );
}
