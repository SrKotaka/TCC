import './NewPost.css';
import {Link} from 'react-router-dom'
import { FaReply } from 'react-icons/fa';

function NewPost() {

  return (
    <>
    <Link to='/'><FaReply className='iconNewPost' /></Link>
      <div className='containerNewPost'>

      </div>
    </>
  );
}

export default NewPost;