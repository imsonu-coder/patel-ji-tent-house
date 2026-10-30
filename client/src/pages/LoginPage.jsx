import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 shadow-soft">
        <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Login</div>
        <h1 className="mt-2 font-[Playfair_Display] text-4xl text-[#33201D]">Welcome back</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[#33201D]">Email</label>
            <input id="login-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-[#33201D]">Password</label>
            <input id="login-password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
          </div>
          {error && <div role="alert" className="rounded-xl border border-[#d7aaa2] bg-[#fff3f0] p-3 text-sm text-[#702721]">{error}</div>}
          <button type="submit" className="w-full rounded-full bg-[#6B1E2B] px-5 py-3 font-semibold text-white">Login</button>
        </form>

        <p className="mt-4 text-sm text-[#806C66]">
          New customer? <Link to="/register" className="font-medium text-[#6B1E2B]">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
