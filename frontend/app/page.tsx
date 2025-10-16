'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ProductDetail from './components/ProductDetail'
import { productDetailsData } from './data/productDetails'
import ChatWidget from './components/ChatWidget'
import Link from 'next/link'

type ProductItem = {
  id: string
  number: string
  name: string
  image: string
  category: string
  status: 'available' | 'sold'
}

const products: ProductItem[] = [
  {
    id: '1',
    number: 'n°0001',
    name: 'Aeron Chair',
    image: '/product_images/landing/aeron.jpg',
    category: 'office chairs',
    status: 'available'
  },
  {
    id: '2',
    number: 'n°0002',
    name: 'Cosm Chair',
    image: '/product_images/landing/cosm.jpg',
    category: 'office chairs',
    status: 'available'
  },
  {
    id: '3',
    number: 'n°0003',
    name: 'Eames Aluminum Group Chair',
    image: '/product_images/landing/eames.jpg',
    category: 'office chairs',
    status: 'available'
  },
  {
    id: '4',
    number: 'n°0004',
    name: 'Lino Chair',
    image: '/product_images/landing/lino.jpg',
    category: 'office chairs',
    status: 'available'
  }
]

const categories = [
  'ALL', 'OFFICE CHAIRS', 'LIVING CHAIRS (coming soon)', 'DESKS (coming soon)',
]

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const filteredProducts = products.filter(product => {
    if (selectedCategory === 'ALL') return true
    const categoryMatch = selectedCategory.toLowerCase() === product.category.toLowerCase()
    const statusMatch = selectedCategory.toLowerCase() === product.status.toLowerCase()
    return categoryMatch || statusMatch
  })

  const selectedProduct = selectedProductId ? productDetailsData[selectedProductId] : null

  return (
    <main className="min-h-screen w-full bg-white flex flex-col">
      {/* Header */}
      <header className="pt-8 pb-4 px-8">
        <div className="max-w-[90vw]">
          <div className="flex flex-col items-start w-[120]">
            <h1 className="font-medium text-2xl tracking-tight">Herm <span className="text-blue-600">&</span> Mills</h1>
            <div className="bg-blue-600 w-full h-4" />
          </div>
        </div>
      </header>

      {/* Category Hero Section */}
      <section className="flex-1 pt-8 pb-16 px-8">
        <div>
          <div className="flex items-end gap-20 mb-20">
            {/* <div className="text-[140px] leading-none font-bold">
              {filteredProducts.length}
            </div> */}
            <div className="flex-1 pt-6">
              <h2 className="text-7xl font-bold mb-2 leading-none tracking-tight">
                {selectedCategory === 'ALL' ? 'All Products' : selectedCategory.split(' ')[0]}
              </h2>
              <nav className="flex flex-wrap gap-x-2 text-sm font-semibold uppercase">
                {categories.map((category, index) => (
                  <div key={category} className="flex items-center">
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className={`hover:underline transition-all ${selectedCategory === category ? 'font-bold text-black' : 'text-gray-500'
                        }`}
                    >
                      {category}
                    </button>
                    {index < categories.length - 1 && <span className="text-gray-500">,</span>}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-20">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className="group block text-left"
              >
                <div className="mb-1 flex flex-row gap-6 items-end">
                  <p className="text-xs uppercase tracking-wider text-gray-500">{product.number}</p>
                  <h3 className="text-sm uppercase font-semibold tracking-tight">
                    {product.name}
                  </h3>
                </div>
                <div className="relative bg-[#c5beb3] flex-shrink-0 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="object-cover border border-gray-200 group-hover:scale-105 transition-transform duration-500 ease-out w-full h-full"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20">
        <div className="border-t border-gray-600">
          <div className="mx-12 md:mx-32 py-8 md:border-l md:border-r border-gray-600">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-16 px-4">
              <div className="flex flex-col justify-between items-start text-base lg:text-lg font-semibold">
                <p className="font-semibold tracking-tight">Herm <span className="text-blue-600">&</span> Mills</p>
                <p className="tracking-tight text-gray-500">©2025</p>
              </div>
              <div>
                <h3 className="text-base lg:text-lg font-semibold tracking-tight">Made with 🍊, and a lot of ☕ by Dave Boku</h3>
              </div>
              <div className="flex flex-col gap-2 md:gap-0 items-center">
                <div className="flex flex-row gap-4 tracking-tight">
                  <Link href="https://www.linkedin.com/in/dave-boku/" target="_blank" rel="noopener noreferrer" className="text-base lg:text-lg font-semibold hover:text-gray-500  ">LinkedIn</Link>
                  <Link href="mailto:info@davesah.bs@gmail.com" className="text-base lg:text-lg font-semibold hover:text-gray-500">Email</Link>
                </div>
                <p className="text-base lg:text-lg font-semibold tracking-tight">+1 469 515 6223</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProductId(null)}
        />
      )}

      {/* Chat Widget */}
      <ChatWidget />
    </main >
  )
}
