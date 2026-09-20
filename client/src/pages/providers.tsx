
// components/providers.tsx
import { AuthProvider } from "@/components/auth/auth-provider"
import { authClient } from "@/lib/auth-client"
import { NavLink, useNavigate } from "react-router-dom"

export function Providers({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  return (
    <AuthProvider
      authClient={authClient}
      navigate={({ to, replace }) => navigate(to, { replace })}
      Link={({ href, ...props }) => <NavLink {...props} to={href} />}
    >
      {children}
    </AuthProvider>
  )
}