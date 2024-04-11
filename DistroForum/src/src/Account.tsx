import { useState } from 'react';
import './Account.css';
import {Link} from 'react-router-dom'
import { FaUser, FaEnvelope, FaLock, FaReply } from 'react-icons/fa';

function Account() {

  const [isRegistering, setIsRegistering] = useState(false);

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
  };

  return (
    <>
      <Link to='/'><FaReply className='iconAccount' /></Link>
      <div className='containerAccount'>
        <form action=''>
          <h1>{isRegistering ? 'Register' : 'Login'}</h1>
          <div className='input-boxAccount'>
            <FaUser className='iconAccount' />
            <input type='text' placeholder='Username' required />
          </div>
          {isRegistering && (
            <div className='input-boxAccount'>
              <FaEnvelope className='iconAccount' />
              <input type='email' placeholder='Email' required />
            </div>
          )}
          <div className='input-boxAccount'>
            <FaLock className='iconAccount' />
            <input type='password' placeholder='Password' required />
          </div>
          <button type='submit'>{isRegistering ? 'Register' : 'Login'}</button>
          <div className='remember-forgotAccount'>
            <label><input type='checkbox' />Remember me <a href='#'>Forgot password?</a></label> 
          </div>
          <div className='register-linkAccount'>
            <p>
              {isRegistering
                ? "Already have an account? "
                : "Don't have an account? "}
              <a href='#' onClick={handleToggleMode}>
                {isRegistering ? 'Login' : 'Register'}
              </a>
            </p>
          </div>
        </form>
      </div>
    </>
  );
}

export default Account;