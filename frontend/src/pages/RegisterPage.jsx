import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', address: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim()) errs.firstName = 'First name is required'
    if (!form.lastName.trim()) errs.lastName = 'Last name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'Min. 6 characters'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      setLoading(true)
      setApiError('')
      await register(form)
      navigate('/')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#FDF6F7]">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center hover:opacity-80 transition-opacity">
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400, letterSpacing: '0.4em', fontSize: '20px', color: '#6B1F2A' }}>
              I W E A R
            </span>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '11px', letterSpacing: '0.2em', color: '#C4A0A6', fontStyle: 'italic' }}>
              boutique
            </span>
          </Link>
          <h1 className="text-2xl font-light mt-6 mb-1 text-[#3D1A1E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Create an account
          </h1>
          <p className="text-sm text-[#9B7B80]">Join IWEAR boutique today</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0D5D8] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="First name" name="firstName" placeholder="Sara" value={form.firstName} onChange={handleChange} error={errors.firstName} />
              <Input label="Last name" name="lastName" placeholder="Ahmed" value={form.lastName} onChange={handleChange} error={errors.lastName} />
            </div>
            <Input label="Email address" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
            <Input label="Password" type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} error={errors.password} autoComplete="new-password" />
            <Input label="Phone (optional)" type="tel" name="phone" placeholder="+1 234 567 8900" value={form.phone} onChange={handleChange} />
            <Input label="Address (optional)" name="address" placeholder="Your address" value={form.address} onChange={handleChange} />

            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {apiError}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-[#9B7B80] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#6B1F2A] hover:text-[#8B2535] transition-colors">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
