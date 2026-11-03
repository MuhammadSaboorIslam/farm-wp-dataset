import {useState,useEffect} from 'react';
import {useDispatch,useSelector} from 'react-redux'
import {Link,useNavigate} from 'react-router-dom'
import {registerUser,clearAuthError} from '../redux/auth'

function Register(){
    const [name,setName]=useState('')
    const [email,setEmail]=useState('')
    const [password, setPassword] = useState('')
    const [role,setRole]=useState('customer')
    const [farmName,setFarmName]=useState('')
    const [location,setLocation]=useState('')
    const [bio,setBio]=useState('')
    const [formerror,setFormerror]=useState('')

    const dispatch=useDispatch()
    const navigate = useNavigate()
    const { user,error,loading }=useSelector(state=> state.auth);

    useEffect(()=>{
        dispatch(clearAuthError())
    },[dispatch])

    useEffect(()=>{
        if(user){
           navigate(user.role === 'farmer' ? '/farmer' : '/')
        }
    },[user,navigate])

    function handlesubmit(e){
        e.preventDefault()
        if(!name.trim()||!email.trim()||!password){
            setFormerror('Please fill in all fields')
            return
        }
        if(password.length<6){
            setFormerror('Password should be at least 6 characters')
            return
        }
        if (role === 'farmer' && (!farmName.trim() || !location.trim())){
            setFormerror('Farm name and location are needed for a farmer account')
            return
        }
        setFormerror('')
        dispatch(registerUser({name:name.trim(), email: email.trim(),password, role, farmName: farmName.trim(), location: location.trim(), bio: bio.trim() }))
    }

    return (
        <div className='card max-w-md mx-auto p-6 mt-6'>
            <h2 className="text-2xl font-bold mb-4">Register</h2>
            <form onSubmit={handlesubmit}>
              <label className="label">
                    Name
                    <input type="text" className="input" value={name} onChange={e =>setName(e.target.value)} placeholder="Your name" />
              </label>
              <label className="label">
                    Email
                        <input type="email" className="input" value={email}
                              onChange={e =>setEmail(e.target.value)} placeholder="you@example.com"/>
              </label>
              <label className="label">
                    Password
                    <input type='password' className="input" value={password} onChange={e=> setPassword(e.target.value)} />
              </label>
              <label className="label">
                    I am a
                  <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
                    <option value="customer">Customer</option>
                    <option value="farmer">Farmer</option>
                    <option value="rider">Rider</option>
                  </select>
              </label>
              {role === 'farmer' && (
                <>
                  <label className="label">Farm name
                    <input className="input" value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="e.g. Green Valley Farm" />
                  </label>
                  <label className="label">Location (city)
                    <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Lahore" />
                  </label>
                  <label className="label">About your farm
                    <textarea rows="3" className="input" value={bio} onChange={e => setBio(e.target.value)} />
                  </label>
                  <p className="muted mb-3">An admin will verify your farm before you can list products.</p>
                </>
              )}
                {(formerror || error) && <p className="err">{formerror || error}</p>}
                <button type="submit" className="btn w-full" disabled={loading}>Create account</button>
           </form>
           <p className="text-sm mt-4">Already have an account? <Link to="/login" className="link">Login</Link></p>
        </div>
    )
}

export default Register
