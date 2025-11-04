import Link from 'next/link'
import Image from 'next/image'
import { Zap, Users, Shield, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <div className="inline-block animate-float">
          <Image 
            src="/logo.svg" 
            alt="WheelWise Logo"
            width={160}
            height={160}
            className="mx-auto mb-6 drop-shadow-2xl md:w-40 md:h-40"
          />
        </div>
        <div className="inline-block">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-neon-blue via-neon-pink to-neon-purple bg-clip-text text-transparent animate-pulse-glow">
            WheelWise
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
          The Smart and Fair Decision Wheel
        </p>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Interactive, provably fair spin-wheel platform with multiplayer features, 
          custom designs, and real-time collaboration.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center pt-6">
          <Link 
            href="/spin"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold hover:shadow-xl hover:scale-105 transition-all neon-border"
          >
            Try Picker Wheel
          </Link>
          <Link 
            href="/room"
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-white font-semibold hover:shadow-xl hover:scale-105 transition-all"
          >
            Create Room
          </Link>
          <Link 
            href="/wheels"
            className="px-8 py-4 bg-slate-800/50 border border-slate-600 rounded-lg text-white font-semibold hover:bg-slate-700/50 transition-all"
          >
            Explore Wheels
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard
          icon={<Shield className="w-12 h-12" />}
          title="Provably Fair"
          description="Commit-reveal algorithm ensures every spin is verifiable and transparent"
          color="text-neon-blue"
        />
        <FeatureCard
          icon={<Users className="w-12 h-12" />}
          title="Multiplayer Rooms"
          description="Live spin rooms with chat, spectator mode, and collaborative editing"
          color="text-neon-pink"
        />
        <FeatureCard
          icon={<Sparkles className="w-12 h-12" />}
          title="Full Customization"
          description="Custom themes, colors, logos, sounds, and celebration animations"
          color="text-neon-green"
        />
        <FeatureCard
          icon={<Zap className="w-12 h-12" />}
          title="Game Modes"
          description="Classic, Elimination, and Weighted spins with virtual token gambling"
          color="text-neon-yellow"
        />
      </section>

      {/* Why Choose WheelWise */}
      <section className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Why Choose WheelWise?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BenefitCard 
            emoji="🎯"
            title="100% Fair"
            description="Transparent algorithm ensures every spin is truly random"
          />
          <BenefitCard 
            emoji="⚡"
            title="Lightning Fast"
            description="Instant room creation and real-time synchronization"
          />
          <BenefitCard 
            emoji="🎨"
            title="Fully Customizable"
            description="Design your wheel exactly how you want it"
          />
          <BenefitCard 
            emoji="🌐"
            title="Collaborate Live"
            description="Share rooms and make decisions together in real-time"
          />
        </div>
      </section>

      {/* Game Modes */}
      <section className="space-y-6">
        <h2 className="text-4xl font-bold text-center text-white">Game Modes</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <GameModeCard
            title="Classic Spin"
            description="Single winner selection from all options. Perfect for raffles and giveaways."
            gradient="from-blue-600 to-cyan-600"
          />
          <GameModeCard
            title="Elimination Mode"
            description="Remove one entry per spin until only one remains. Great for tournaments."
            gradient="from-purple-600 to-pink-600"
          />
          <GameModeCard
            title="Weighted Spins"
            description="Assign different probabilities to options. Ideal for probability-based decisions."
            gradient="from-orange-600 to-red-600"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 py-12 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl border border-purple-500/30">
        <h2 className="text-4xl font-bold text-white">Ready to Spin?</h2>
        <p className="text-xl text-gray-300">
          Create your first wheel and experience the fairest way to make decisions
        </p>
        <Link 
          href="/wheel/create"
          className="inline-block px-10 py-5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg text-white text-lg font-bold hover:shadow-2xl hover:scale-110 transition-all neon-border"
        >
          Get Started - It&apos;s Free!
        </Link>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700 hover:border-slate-500 transition-all hover:scale-105">
      <div className={`${color} mb-4`}>{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

function BenefitCard({ emoji, title, description }: { 
  emoji: string
  title: string
  description: string 
}) {
  return (
    <div className="text-center space-y-3">
      <div className="text-5xl">{emoji}</div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

function GameModeCard({ title, description, gradient }: {
  title: string
  description: string
  gradient: string
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-white hover:scale-105 transition-all`}>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-gray-100">{description}</p>
    </div>
  )
}
