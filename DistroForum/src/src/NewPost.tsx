import './NewPost.css';
import {Link} from 'react-router-dom'
import { FaReply } from 'react-icons/fa';
import UploadIcon from '../assets/UploadIcon.png'

function NewPost() {

  return (
    <>
    <Link to='/'><FaReply className='iconNewPost' /></Link>
      <div className='containerNewPost'>
        <form>
          <input type='text' placeholder='Tittle problem' />
          <input type='text' placeholder='Write here your problem' />
          <img src={UploadIcon} alt='img' />
          <input type='file'></input>
          <input type='button' value='Post' />
        </form>
      </div>
    </>
  );
}

export default NewPost;