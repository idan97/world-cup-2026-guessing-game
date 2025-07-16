import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🏆 World Cup 2026 Guessing Game
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SignedOut>
          <div className="text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Predict the World Cup 2026!
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join the ultimate football prediction game. Guess match results, 
              predict winners, and compete with friends in private leagues.
            </p>
                         <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
               <SignInButton mode="modal">
                 <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg text-lg transition-colors">
                   Get Started
                 </button>
               </SignInButton>
               <SignInButton mode="modal">
                 <button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-8 rounded-lg text-lg border-2 border-blue-600 transition-colors">
                   Sign In
                 </button>
               </SignInButton>
             </div>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-3xl mb-4">⚽</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Predict Matches
                </h3>
                <p className="text-gray-600">
                  Guess the scores of all World Cup matches and earn points for accurate predictions.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-3xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Join Leagues
                </h3>
                <p className="text-gray-600">
                  Create private leagues with friends or join public competitions.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Track Progress
                </h3>
                <p className="text-gray-600">
                  Monitor your ranking, compare results, and see detailed statistics.
                </p>
              </div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Welcome back! 🎉
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Ready to make your predictions?
            </p>
                         <a href="/home">
               <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg text-lg transition-colors">
                 Go to Dashboard
               </button>
             </a>
          </div>
        </SignedIn>
      </main>
    </div>
  )
}
