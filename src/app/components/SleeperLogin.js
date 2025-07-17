'use client'
import { useState } from 'react'

export default function SleeperLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`https://api.sleeper.app/v1/user/${username}`)
      if (!res.ok) throw new Error('User not found')
      const data = await res.json()
      onLogin(username, data.user_id)
    } catch (err) {
      setError('Username not found. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-center">🔑 Sleeper Login</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter Sleeper username"
        className="w-full p-2 border border-gray-300 rounded mb-3"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Loading...' : 'Connect Sleeper'}
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </form>
  )
}