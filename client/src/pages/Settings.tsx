import { AccountSettings} from "@/components/auth/settings/account/account-settings"
import { ChangePassword } from "@/components/auth/settings/security/change-password"

const Settings = () => {
  return (
    <div className="w-full p-4 flex justify-center items-center min-h-[90vh] flex-col gap-6">
      <AccountSettings
        classNames={{
            card:{
                base:'bg-black/10 ring ring-indigo-950 max-w-xl mx-auto',
                body: 'font-bold',
                footer: 'bg-black/10 ring ring-indigo-950'
            }
            
        }}/>
         <div className="w-full">
      <ChangePassword 
      classNames={{
            
                base:'bg-black/10 ring ring-indigo-950 max-w-xl mx-auto',
                body: 'font-bold',
                footer: 'bg-black/10 ring ring-indigo-950'
            
        }}/>
    </div>
      
    </div>
  )
}

export default Settings
