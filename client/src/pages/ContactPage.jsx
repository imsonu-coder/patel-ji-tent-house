import { useState } from 'react';
import { MapPin, Phone, MessageCircle } from 'lucide-react';
import api from '../api/client';
import ShopLocationMap from '../components/ShopLocationMap';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/contact', form);
      setSuccess('Thanks! Your message has been shared with the team.');
      setForm({ name: '', phone: '', message: '' });
    } catch (error) {
      setSuccess('Unable to send message right now. Please try again later.');
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
            <div className="flex items-center gap-3 text-[#33201D]"><Phone size={18} /> +91 XXXXX XXXXX</div>
            <div className="mt-4 flex items-center gap-3 text-[#33201D]"><MessageCircle size={18} /> WhatsApp: +91 XXXXX XXXXX</div>
            <div className="mt-4 flex items-center gap-3 text-[#33201D]"><MapPin size={18} /> Demo address, Jaipur</div>
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
              <label className="mb-2 block text-sm font-medium text-[#33201D]">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#33201D]">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#33201D]">Message</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows="5" className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
            </div>
            <button type="submit" className="rounded-full bg-[#6B1E2B] px-6 py-3 font-semibold text-white">Submit</button>
            {success && <div className="text-sm text-[#6B1E2B]">{success}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
