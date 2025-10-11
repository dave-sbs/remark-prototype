'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ProductDetail from './components/ProductDetail'
import { productDetailsData } from './data/productDetails'
import ChatWidget from './components/ChatWidget'

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
    image: '/product_images/aeron-landing.png',
    category: 'office chairs',
    status: 'available'
  },
  {
    id: '2',
    number: 'n°0002',
    name: 'Cosm Chair',
    image: '/product_images/cosm-landing.png',
    category: 'office chairs',
    status: 'available'
  },
  {
    id: '3',
    number: 'n°0003',
    name: 'Eames Aluminum Group Chair',
    image: '/product_images/eames-landing.png',
    category: 'office chairs',
    status: 'available'
  },
  {
    id: '4',
    number: 'n°0004',
    name: 'Lino Chair',
    image: '/product_images/lino-landing.png',
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
    <main className="min-h-screen w-full bg-white px-8">
      {/* Header */}
      <header className="pt-8 pb-4">
        <div className="max-w-[90vw]">
          <div className="flex flex-row items-start justify-between">
            <h1 className="font-medium mb-3 tracking-tight">BOKU STUDIO</h1>
            <nav className="flex font-semibold text-lg">
              <a href="#" className="hover:underline ml-1">Furniture</a>
              <span>,</span>
              <a href="#studio" className="ml-1 hover:underline">Studio</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Category Hero Section */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-start gap-40 mb-20">
            <div className="text-[140px] leading-none font-bold">
              {filteredProducts.length}
            </div>
            <div className="flex-1 pt-6">
              <h2 className="text-7xl font-bold mb-2 leading-none">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className="group block text-left"
              >
                <div className="mb-5 flex flex-row gap-4 items-end">
                  <p className="text-xs uppercase tracking-wider">{product.number}</p>
                  <h3 className="text-sm uppercase font-medium tracking-wide group-hover:underline">
                    {product.name}
                  </h3>
                </div>
                <div className="aspect-square relative bg-[#c5beb3] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 mt-40">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-20">
            <div>
              <h3 className="text-lg font-semibold uppercase">scandinavian functionality</h3>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold uppercase">Boston, MA | Copenhagen, DK</h3>
              <p className="text-lg font-semibold">+1 469 515 6223</p>
            </div>
            <div className="flex flex-col space-y-1">
              <a href="#instagram" className="text-lg font-semibold hover:underline">INSTAGRAM</a>
              <a href="mailto:info@davesah.bs@gmail.com" className="text-lg font-semibold hover:underline">EMAIL</a>
            </div>
            <div className="flex flex-col space-y-1 justify-between items-start text-lg font-semibold">
              <p className="uppercase tracking-wider">Boku Studio</p>
              <p>©2025</p>
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
