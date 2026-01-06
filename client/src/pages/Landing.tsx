import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-moss-600 bg-forest-600">
        <nav className="mx-auto max-w-7xl px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="text-xl font-bold text-white">TaskFlow</div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="rounded-md px-4 py-2 text-sm font-medium text-forest-100 transition-colors hover:bg-forest-700 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-800"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold text-forest-900">
          Organize Your Life, One Task at a Time
        </h1>
        <p className="mb-10 text-xl text-forest-700">
          A simple, powerful todo app that helps you stay on top of your tasks with priority management, due dates, and insightful reports.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/register"
            className="rounded-md bg-forest-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-forest-700"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="rounded-md border-2 border-forest-600 px-8 py-3 text-lg font-semibold text-forest-700 transition-colors hover:bg-forest-50"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-forest-900">
          Everything You Need to Stay Productive
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-sage-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-semibold text-forest-800">Priority Management</h3>
            <p className="text-forest-700">
              Set priorities for your tasks and focus on what matters most. Sort by urgency to tackle your most important work first.
            </p>
          </div>
          <div className="rounded-lg border border-sage-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-semibold text-forest-800">Due Date Tracking</h3>
            <p className="text-forest-700">
              Never miss a deadline. Assign due dates to tasks and get instant visibility into what's due today.
            </p>
          </div>
          <div className="rounded-lg border border-sage-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-semibold text-forest-800">Smart Organization</h3>
            <p className="text-forest-700">
              Sort and filter tasks by priority, due date, or status. Customize your view to match your workflow.
            </p>
          </div>
          <div className="rounded-lg border border-sage-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-semibold text-forest-800">Reports & Analytics</h3>
            <p className="text-forest-700">
              Track your productivity trends and completion statistics. Understand your patterns and improve over time.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-sage-50 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-forest-900">
            Get Started in Minutes
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-600 text-2xl font-bold text-white">
                  1
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-forest-800">Create Your Account</h3>
              <p className="text-forest-700">
                Sign up for free in seconds. No credit card required.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-600 text-2xl font-bold text-white">
                  2
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-forest-800">Add Your Tasks</h3>
              <p className="text-forest-700">
                Create tasks, set priorities, and assign due dates to stay organized.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-600 text-2xl font-bold text-white">
                  3
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-forest-800">Stay on Track</h3>
              <p className="text-forest-700">
                Complete tasks, track your progress, and achieve your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold text-forest-900">Ready to Get Organized?</h2>
        <p className="mb-8 text-xl text-forest-700">
          Join today and take control of your tasks
        </p>
        <Link
          to="/register"
          className="rounded-md bg-forest-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-forest-700"
        >
          Sign Up Now
        </Link>
      </section>
    </div>
  );
}
