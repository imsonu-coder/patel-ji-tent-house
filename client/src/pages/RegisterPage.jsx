import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await registerUser(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 shadow-soft">
        <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Register</div>
        <h1 className="mt-2 font-[Playfair_Display] text-4xl text-[#33201D]">Create account</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#33201D]">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#33201D]">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#33201D]">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#33201D]">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#33201D]">Confirm password</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
          </div>
          {error && <div className="text-sm text-[#6B1E2B]">{error}</div>}
          <button type="submit" className="w-full rounded-full bg-[#6B1E2B] px-5 py-3 font-semibold text-white">Create account</button>
        </form>

        <p className="mt-4 text-sm text-[#806C66]">
          Already have an account? <Link to="/login" className="font-medium text-[#6B1E2B]">Login</Link>
        </p>
      </div>
    </div>
  );
}
