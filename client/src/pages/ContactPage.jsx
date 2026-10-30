import { useState } from 'react';
import { MapPin, Phone, MessageCircle } from 'lucide-react';
import api from '../api/client';
import ShopLocationMap from '../components/ShopLocationMap';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/contact', form);
      setSuccess('Thanks! Your message has been shared with the team.');
      setForm({ name: '', phone: '', message: '' });
    } catch (error) {
      console.error('Failed to send contact message:', error);
      setSuccess('Unable to send message right now. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Contact</div>
        <h1 className="mt-2 font-[Playfair_Display] text-5xl text-[#33201D]">Get in touch</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#F0D7AF] bg-[#FFFDF9] p-6 shadow-soft">
            <div className="flex items-center gap-3 text-[#33201D]"><Phone size={18} /> +91 98290 12345</div>
            <div className="mt-4 flex items-center gap-3 text-[#33201D]"><MessageCircle size={18} /> WhatsApp: +91 98290 12345</div>
            <div className="mt-4 flex items-center gap-3 text-[#33201D]"><MapPin size={18} /> Plot 14, Main Mansarovar Road, Jaipur, Rajasthan 302020</div>
          </div>
          <div className="rounded-3xl border border-[#F0D7AF] bg-[#F7EBDD] p-6 shadow-soft">
            <div className="font-semibold text-[#33201D]">Business hours</div>
            <div className="mt-3 text-sm text-[#33201D]">Monday - Saturday: 9:00 AM to 8:00 PM</div>
          </div>
          <div className="rounded-3xl border border-[#F0D7AF] bg-white p-2 shadow-soft">
            <ShopLocationMap />
          </div>
        </div>

        <div className="rounded-3xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 shadow-soft">
          <h2 className="font-[Playfair_Display] text-3xl text-[#33201D]">Send a message</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-[#33201D]">Name</label>
              <input id="contact-name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
            </div>
            <div>
              <label htmlFor="contact-phone" className="mb-2 block text-sm font-medium text-[#33201D]">Phone</label>
              <input id="contact-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
            </div>
            <div>
              <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-[#33201D]">Message</label>
              <textarea id="contact-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows="5" className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
            </div>
            <button type="submit" disabled={submitting} className="min-h-12 rounded-full bg-[#6B1E2B] px-6 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-70">
              {submitting ? 'Sending...' : 'Submit'}
            </button>
            {success && (
              <div
                role={success.startsWith('Unable') ? 'alert' : 'status'}
                aria-live={success.startsWith('Unable') ? 'assertive' : 'polite'}
                className={`text-sm ${success.startsWith('Unable') ? 'text-[#702721]' : 'text-[#45121C]'}`}
              >
                {success}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
