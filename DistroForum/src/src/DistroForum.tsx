import './DistroForum.css'
import Icon from '../assets/Icon.png'
import SearchIcon from '../assets/SearchIcon.png'

function DistroForum() {

  return (
    <>
      <div className='container'>
        <img src={Icon} className='icon'/>
        <h2 className='title'>Distro<span className='modernTitle'> Forum</span></h2>
        <div className='containerCenter'>
          <select>
            <option value="">Select a Windows distribution</option>
            <option value="1">Windows 10</option>
            <option value="2">Windows 8.1</option>
            <option value="3">Windows 7</option>
            <option value="4">Windows 11</option>
          </select>
          <select>
            <option value="">Select a MacOS distribution</option>
            <option value="5">macOS Monterey</option>
            <option value="6">macOS Big Sur</option>
            <option value="7">macOS Catalina</option>
          </select>
          <select>
            <option value="">Select a Linux distribution</option>
            <option value="8">Ubuntu</option>
            <option value="9">Debian</option>
            <option value="10">Fedora</option>
            <option value="11">Linux Mint</option>
            <option value="12">CentOS</option>
            <option value="13">Arch Linux</option>
            <option value="14">Manjaro</option>
            <option value="15">openSUSE</option>
            <option value="16">elementary OS</option>
            <option value="17">CentOS Stream</option>
            <option value="18">Kali Linux</option>
            <option value="19">Pop!_OS</option>
            <option value="20">Zorin OS</option>
            <option value="21">Fedora Silverblue</option>
            <option value="22">CentOS Linux</option>
            <option value="23">MX Linux</option>
            <option value="24">Solus</option>
            <option value="25">Slackware</option>
          </select>
          <input type="text" placeholder="Search..."/>
          <button><img src={SearchIcon} className='searchIcon'/></button>
        </div>
      </div>
    </>
  )
}

export default DistroForum