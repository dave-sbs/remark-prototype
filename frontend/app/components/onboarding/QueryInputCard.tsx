'use client'

import { useState } from 'react'

interface QueryInputCardProps {
    onSubmit: (query: string) => void
}

export default function QueryInputCard({ onSubmit }: QueryInputCardProps) {
    const [query, setQuery] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = () => {
        if (query.trim().length < 10) {
            setError('Please provide at least 10 characters to help us match you with the right expert')
            return
        }

        setError('')
        onSubmit(query.trim())
    }

    return (
        <div className="bg-white rounded-lg p-4 max-w-sm">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
                What do you need help with? Please be as descriptive as possible as it helps us match you with the right expert.
            </p>

            <textarea
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value)
                    if (error) setError('') // Clear error on typing
                }}
                placeholder=""
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm mb-2"
            />

            {error && (
                <p className="text-xs text-red-600 mb-3">{error}</p>
            )}

            <button
                onClick={handleSubmit}
                disabled={!query.trim()}
                className="w-full bg-black text-white rounded-lg py-3 px-4 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
                Submit
            </button>
        </div>
    )
}
