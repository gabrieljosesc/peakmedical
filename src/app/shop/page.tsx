import { createAdminClient } from '@/lib/supabase/server'
import { Product, Brand, Category } from '@/types'
import ProductCard from '@/components/products/ProductCard'
import ShopFilters from '@/components/products/ShopFilters'
import ShopSort from '@/components/products/ShopSort'
import Pagination from '@/components/products/Pagination'

const PAGE_SIZE = 20

type SearchParams = Record<string, string | string[] | undefined>

function getString(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0]
  return val
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const search = getString(params.search)
  const category = getString(params.category)
  const brand = getString(params.brand)
  const min_price = getString(params.min_price)
  const max_price = getString(params.max_price)
  const sort = getString(params.sort) ?? 'latest'
  const page = Math.max(1, parseInt(getString(params.page) ?? '1'))

  const supabase = createAdminClient()

  let query = supabase
    .from('products')
    .select('*, category:categories(*), brand:brands(*)', { count: 'exact' })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }
  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }
  if (brand) {
    const { data: br } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', brand)
      .single()
    if (br) query = query.eq('brand_id', br.id)
  }
  if (min_price) query = query.gte('price', parseFloat(min_price))
  if (max_price) query = query.lte('price', parseFloat(max_price))

  switch (sort) {
    case 'price_asc': query = query.order('price', { ascending: true }); break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    default: query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * PAGE_SIZE
  query = query.range(from, from + PAGE_SIZE - 1)

  const { data: products, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from('brands').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
  ])

  const currentParams: Record<string, string | undefined> = {
    search, category, brand, min_price, max_price, sort,
    page: page > 1 ? String(page) : undefined,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {search ? `Search results for "${search}"` : 'All Products'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{count ?? 0} products found</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <ShopFilters
            brands={(brands as Brand[]) ?? []}
            categories={(categories as Category[]) ?? []}
            currentParams={currentParams}
          />
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Showing {from + 1}–{Math.min(from + PAGE_SIZE, count ?? 0)} of {count ?? 0} results
            </p>
            <ShopSort currentSort={sort} />
          </div>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {(products as Product[]).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination currentPage={page} totalPages={totalPages} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
