import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Package, Heart, User, LogOut } from 'lucide-react'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const displayName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || user.email
    : user.email

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Account</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <div className="w-12 h-12 rounded-full bg-[#1a3a5c]/10 flex items-center justify-center mb-3">
            <User className="w-6 h-6 text-[#1a3a5c]" />
          </div>
          <h2 className="font-semibold text-gray-800">{displayName}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
          {profile?.company && <p className="text-sm text-gray-500">{profile.company}</p>}
        </div>

        <Link href="/account/orders" className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="font-semibold text-gray-800">My Orders</h2>
          <p className="text-sm text-gray-500">{orderCount ?? 0} orders placed</p>
        </Link>

        <Link href="/account/wishlist" className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="font-semibold text-gray-800">Wishlist</h2>
          <p className="text-sm text-gray-500">Saved products</p>
        </Link>
      </div>

      <div className="flex gap-3">
        <Link href="/shop" className={buttonVariants({ variant: 'outline' })}>
          Continue Shopping
        </Link>
        <Link
          href="/auth/logout"
          className={cn(buttonVariants({ variant: 'outline' }), 'text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 flex items-center gap-2')}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Link>
      </div>
    </div>
  )
}
