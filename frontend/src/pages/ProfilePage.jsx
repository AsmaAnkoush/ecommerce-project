import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getProfile, updateProfile } from '../api/userApi'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getProfile()
      .then((res) => {
        const u = res.data.data
        setForm({ firstName: u.firstName, lastName: u.lastName, phone: u.phone || '', address: u.address || '' })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      await updateProfile(form)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-light text-[#3D1A1E] mb-8" style={{ fontFamily: 'Cormorant Garamond, serif' }}>My Profile</h1>

      {/* User info card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#F0D5D8] p-6 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-[#6B1F2A] text-white rounded-full flex items-center justify-center text-xl font-light shrink-0" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px' }}>
          {user?.firstName?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-[#3D1A1E]">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-[#9B7B80]">{user?.email}</p>
          <span className="inline-block mt-1 text-xs bg-[#FDF0F2] text-[#6B1F2A] px-2.5 py-0.5 rounded-full font-medium border border-[#EDD8DC]">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#F0D5D8] p-6">
        <h2 className="text-lg font-light text-[#3D1A1E] mb-5" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Edit Information</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <Input label="Last name" name="lastName" value={form.lastName} onChange={handleChange} required />
          </div>
          <Input label="Phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 8900" />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} placeholder="Your shipping address" />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              Profile updated successfully!
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button type="submit" loading={saving}>Save Changes</Button>
            <Button type="button" variant="danger" size="sm" onClick={logout}>Sign Out</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
