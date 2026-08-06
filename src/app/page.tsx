/**
 * Home Page
 *
 * Redirects to the dashboard. With guest mode enabled,
 * visitors will see the dashboard with demo data.
 */

import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/dashboard')
}
