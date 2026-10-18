import { useState } from 'react';
import { cn } from '../cn';
import { lineUrl, store } from '../data';
import { usePageTitle } from '../usePageTitle';

const topics = ['Sizing and products', 'Made to order or alterations', 'Wholesale and partnerships', 'Something else'];

interface FormState {
  name: string;
  email: string;
  topic: string;
  message: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const empty: FormState = { name: '', email: '', topic: topics[0], message: '' };

function validate(f: FormState): Errors {
  const errors: Errors = {};
  if (!f.name.trim()) errors.name = 'Enter your name so we know who to reply to.';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) errors.email = 'Enter a full email address, e.g. name@example.com.';
  if (f.message.trim().length < 10) errors.message = 'Write at least 10 characters.';
  return errors;
}

const fieldClass = (invalid: boolean) =>
  cn(
    'mt-1.5 block w-full border bg-white px-3 py-2.5 text-base',
    invalid ? 'border-red-700' : 'border-ink/20 focus:border-hom'
  );

export default function ContactPage() {
  usePageTitle('Contact');
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [sentTo, setSentTo] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    // TODO: send to API once a contact endpoint exists.
    setSentTo(form.email);
    setForm(empty);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <h1 className="text-balance font-display text-3xl font-semibold sm:text-4xl">Contact</h1>
      <p className="mt-3 max-w-xl text-pretty text-ink/70">
        Ask about sizing or fabric, or book a fitting. We reply to every message within one working day.
      </p>

      <div className="mt-12 grid gap-14 md:grid-cols-[2fr_3fr]">
        <section aria-labelledby="hours-heading" className="space-y-8 text-[15px]">
          <div>
            <h2 id="hours-heading" className="font-display text-lg font-semibold">
              Opening hours
            </h2>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 tabular-nums">
              {store.hours.map((h) => (
                <div key={h.days} className="contents">
                  <dt className="text-ink/60">{h.days}</dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Other ways to reach us</h2>
            <ul className="mt-2 space-y-1">
              <li>
                Email{' '}
                <a href={`mailto:${store.email}`} className="text-hom hover:underline">
                  {store.email}
                </a>
              </li>
              <li>
                LINE{' '}
                <a href={lineUrl(store.line)} target="_blank" rel="noreferrer" className="text-hom hover:underline">
                  {store.line}
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="form-heading" className="bg-white p-6 sm:p-8">
          <h2 id="form-heading" className="font-display text-lg font-semibold">
            Send a message
          </h2>

          {sentTo && (
            <div role="status" className="mt-4 border-l-2 border-hom bg-cotton px-4 py-3 text-sm">
              Message received. We will reply to {sentTo}.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            <div>
              <label htmlFor="c-name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="c-name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'c-name-err' : undefined}
                className={fieldClass(!!errors.name)}
              />
              {errors.name && (
                <p id="c-name-err" className="mt-1.5 text-sm text-red-700">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="c-email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="c-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'c-email-err' : undefined}
                className={fieldClass(!!errors.email)}
              />
              {errors.email && (
                <p id="c-email-err" className="mt-1.5 text-sm text-red-700">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="c-topic" className="text-sm font-medium">
                Topic
              </label>
              <select
                id="c-topic"
                value={form.topic}
                onChange={(e) => set('topic', e.target.value)}
                className={fieldClass(false)}
              >
                {topics.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="c-message" className="text-sm font-medium">
                Message
              </label>
              <textarea
                id="c-message"
                rows={5}
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'c-message-err' : undefined}
                className={fieldClass(!!errors.message)}
              />
              {errors.message && (
                <p id="c-message-err" className="mt-1.5 text-sm text-red-700">
                  {errors.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center bg-hom px-6 font-medium text-cotton transition-colors hover:bg-hom-dark"
            >
              Send message
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
