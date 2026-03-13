import { Redirect } from 'expo-router';

/**
 * Root index — the NavigationGuard in _layout.tsx handles
 * routing logic. This just provides a default redirect.
 */
export default function Index() {
  return <Redirect href="/home" />;
}
