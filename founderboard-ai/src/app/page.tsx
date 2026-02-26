import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            FounderBoard AI
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm hover:underline">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              The AI-Powered Dashboard for{' '}
              <span className="text-primary">Startup Founders</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track your metrics, generate investor updates, and manage tasks - all in one place.
              Built by founders, for founders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Powerful tools designed specifically for startup founders to stay organized and
                communicate effectively.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Dashboard Feature */}
              <Card>
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Metrics Dashboard</h3>
                  <p className="text-muted-foreground">
                    Track MRR, active users, churn rate, and more. See trends over time with
                    beautiful charts.
                  </p>
                </CardContent>
              </Card>

              {/* AI Studio Feature */}
              <Card>
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI Content Studio</h3>
                  <p className="text-muted-foreground">
                    Generate investor updates, pitch decks, and social posts with AI that knows your
                    metrics.
                  </p>
                </CardContent>
              </Card>

              {/* Task Board Feature */}
              <Card>
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Task Board</h3>
                  <p className="text-muted-foreground">
                    Kanban-style task management with drag-and-drop. Assign tasks to team members
                    with ease.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
              We&apos;re currently in MVP. Get started free and help shape the future of
              FounderBoard AI.
            </p>

            <Card className="max-w-sm mx-auto">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <span className="text-4xl font-bold">Free</span>
                  <span className="text-muted-foreground ml-2">during MVP</span>
                </div>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Full metrics dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    AI content generation
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Kanban task board
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Team collaboration
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/signup">Get Started Free</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join other founders who are using FounderBoard AI to stay organized and communicate
              effectively with their investors.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">Create Your Account</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">FounderBoard AI</span>
              <span className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()}
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-foreground">
                Sign In
              </Link>
              <Link href="/signup" className="hover:text-foreground">
                Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
