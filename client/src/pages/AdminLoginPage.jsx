import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { user } = await login(form.email, form.password);
      if (user.role !== 'admin') {
        logout();
        setError('This account does not have admin access.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 shadow-soft">
        <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Admin</div>
        <h1 className="mt-2 font-[Playfair_Display] text-4xl text-[#33201D]">Admin login</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="admin-login-email" className="mb-2 block text-sm font-medium text-[#33201D]">Email</label>
            <input id="admin-login-email" type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
          </div>
          <div>
            <label htmlFor="admin-login-password" className="mb-2 block text-sm font-medium text-[#33201D]">Password</label>
            <input id="admin-login-password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-[#E7CC91] bg-white p-3 outline-none" required />
          </div>
          {error && <div role="alert" className="text-sm text-[#6B1E2B]">{error}</div>}
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#6B1E2B] px-5 py-3 font-semibold text-white disabled:opacity-60">
            {submitting ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
