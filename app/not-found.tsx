import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center space-y-6">
        <div className="text-8xl font-bold text-transparent bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text">
          404
        </div>
        <h2 className="text-3xl font-bold text-white">Page Not Found</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold hover:shadow-xl transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
