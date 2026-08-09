import { useState, FormEvent } from 'react';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // No backend contact endpoint exists yet — hands off to the user's mail client
    // with the message pre-filled, so the form is still genuinely functional.
    const subject = encodeURIComponent(`HireLoop contact form — ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:support@hireloop.dev?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <p className="eyebrow mb-3">Contact</p>
      <h1 className="font-serif text-4xl">Get in touch</h1>
      <p className="mt-3 text-ink-soft">This opens your email client with the message pre-filled — nothing is stored on our side.</p>

      {sent ? (
        <p className="mt-8 text-loop">Opening your email client… didn't work? Email us directly at support@hireloop.dev.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm text-ink-soft">Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-ink-soft">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-ink-soft">Message</label>
            <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop" />
          </div>
          <button type="submit" className="btn-primary">Send message</button>
        </form>
      )}
    </div>
  );
}
