
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Projects from './pages/Projects'
import MyProjects from './pages/MyProjects'
import Preview from './pages/Preview'
import Community from './pages/Community'
import View from './pages/View'
import Navbar from './components/Navbar'
import { Toaster,toast} from "@/components/ui/toast"
import AuthPage from './pages/auth/AuthPage'
import Settings from './pages/Settings'
import Loading from './pages/Loading'

const App = () => {

  const {pathname}= useLocation()

  const hideNavbar =pathname.startsWith('/projects/') && pathname !== '/projects'
                    ||pathname.startsWith('/view/')
                    ||pathname.startsWith('/preview/')

  return (
    <div>
      <Toaster />
      {!hideNavbar &&< Navbar/>}
      {/* <Navbar/> */}
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/pricing' element={<Pricing/>}/>
        <Route path='/Projects/:projectId' element={<Projects/>}/>
        <Route path='/Projects' element={<MyProjects/>}/>
        <Route path='/Preview/:projectId' element={<Preview/>}/>
        <Route path='/Preview/:projectId/:versionId' element={<Preview/>}/>
        <Route path='/Community' element={<Community/>}/>
        <Route path='/View/:projectId' element={<View/>}/>
        <Route path="/auth/:pathname" element={<AuthPage />} />
        <Route path="settings/account/" element={<Settings />} />
        <Route path='/loading' element={<Loading/>}/>
      </Routes>
      
    </div>
  )
}

export default App
