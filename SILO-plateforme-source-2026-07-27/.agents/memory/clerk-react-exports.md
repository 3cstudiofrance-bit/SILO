---
name: Clerk React exports
description: Which auth-gate components exist (and don't) in @clerk/react v6
---

`SignedIn` and `SignedOut` wrapper components are NOT exported by `@clerk/react` v6.

**Why:** The package changed its API — these components were removed or never included in this version.

**How to apply:** Use `useUser()` hook with `isLoaded` + `isSignedIn` guards inside route wrapper components:

```tsx
function ProtectedRoute({ component: Component }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <Component />;
}
```

For admin gates, also check `user?.publicMetadata?.role === "admin"`.
