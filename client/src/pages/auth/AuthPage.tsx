// pages/auth/AuthPage.tsx
import { useParams } from "react-router-dom"
import { Auth } from "@/components/auth/auth"

export default function AuthPage() {
  const { pathname } = useParams()
  return (
    <main className="p-6 flex flex-col justify-center items-center h-[80vh]">
      <Auth path={pathname} 
       className='bg-black/10 ring ring-indigo-900'/>
      </main>

  )
}