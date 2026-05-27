'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '', password: '', confirm_password: '',
    first_name: '', last_name: '', company: '', phone: '',
  })
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.first_name,
          last_name: form.last_name,
          company: form.company,
          phone: form.phone,
        },
      },
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Please check your email to verify.')
      router.push('/auth/login')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl border shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create an account</h1>
        <p className="text-sm text-gray-500 mb-6">For licensed medical professionals only</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" value={form.first_name} onChange={set('first_name')} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" value={form.last_name} onChange={set('last_name')} required className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="company">Clinic / Company Name</Label>
            <Input id="company" value={form.company} onChange={set('company')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={set('phone')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">Email address *</Label>
            <Input id="email" type="email" value={form.email} onChange={set('email')} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input id="password" type="password" value={form.password} onChange={set('password')} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="confirm_password">Confirm Password *</Label>
            <Input id="confirm_password" type="password" value={form.confirm_password} onChange={set('confirm_password')} required className="mt-1" />
          </div>
          <p className="text-xs text-gray-400">
            By registering you agree to our{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> and{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>.
          </p>
          <Button type="submit" disabled={loading} className="w-full bg-[#1a3a5c] hover:bg-[#152f4a]">
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#1a3a5c] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
