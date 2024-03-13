import './Account.css'
import {FaUser, FaLock} from 'react-icons/fa';

function Account() {
  return (
    <>
      <div className='containerAccount'>
        <form action=''>
          <h1>Login</h1>
          <div className='input-boxAccount'>
            <FaUser className='iconAccount'/>
            <input type='text' placeholder='Username' required />
          </div>
          <div className='input-boxAccount'>
            <FaLock className='iconAccount'/>
            <input type='password' placeholder='Password' required />
          </div>
          <button type='submit'>Login</button>
          <div className='remember-forgotAccount'>
            <label><input type='checkbox'/> Remember me </label>
            <a href='#'>Forgot password?</a>
          </div>
          <div className='register-linkAccount'>
            <p>Don't have an account? <a href='#'>Register</a></p>
          </div>
        </form>
      </div>
    </>
  )
}

export default Account