import './Account.css'
import {FaUser, FaLock} from 'react-icons/fa';

function Account() {
  return (
    <>
      <div className='containerAccount'>
        <div className='wrapperAccount'>
          <form action=''>
            <h1>Login</h1>
            <div className='input-boxAccount'>
              <input type='text' placeholder='Username' required />
              <FaUser className='iconAccount'/>
            </div>
            <div className='input-boxAccount'>
              <input type='password' placeholder='Password' required />
              <FaLock className='iconAccount'/>
            </div>
            <div className='remember-forgotAccount'>
              <label><input type='checkbox'/>Remember me</label>
              <a href='#'>Forgot password?</a>
            </div>
            <button type='submit'>Login</button>
            <div className='register-linkAccount'>
              <p>Don't have an account?<a href='#'>Register</a></p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default Account