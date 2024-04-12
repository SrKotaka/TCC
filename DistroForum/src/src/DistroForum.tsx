import { useState, useEffect } from 'react';
import {Link} from 'react-router-dom'
import './DistroForum.css'
import Icon from '../assets/Icon.png'
import SearchIcon from '../assets/SearchIcon.png'

function DistroForum() {
  const [windowsDistro, setWindowsDistro] = useState("");
  const [macDistro, setMacDistro] = useState("");
  const [linuxDistro, setLinuxDistro] = useState("");

  useEffect(() => {
    if (windowsDistro !== "") {
      setMacDistro("");
      setLinuxDistro("");
    }
  }, [windowsDistro]);

  useEffect(() => {
    if (macDistro !== "") {
      setWindowsDistro("");
      setLinuxDistro("");
    }
  }, [macDistro]);

  useEffect(() => {
    if (linuxDistro !== "") {
      setWindowsDistro("");
      setMacDistro("");
    }
  }, [linuxDistro]);

  return (
    <>
      <div className='containerDistroForum'>
        <div className='headerDistroForum'>
          <div>
            <img src={Icon} className='iconDistroForum'/>
            <h2 className='titleDistroForum'>Distro<span className='modernTitleDistroForum'> Forum</span></h2>
          </div>
          <div>
            <Link to='/Account' className='accountDistroForum'>Login</Link>
            <h6 className='accountH6DistroForum'>Don't have account? Click here</h6>
          </div>
        </div>
        <div className='containerCenterDistroForum'>
          <select value={windowsDistro} onChange={(e) => setWindowsDistro(e.target.value)}>  
            <option value="">Select a Windows distribution</option>
            <option value="1">Windows 10</option>
            <option value="2">Windows 8.1</option>
            <option value="3">Windows 7</option>
            <option value="4">Windows 11</option>
          </select>
          <select value={windowsDistro} onChange={(e) => setWindowsDistro(e.target.value)}>
            <option value="">Select a MacOS distribution</option>
            <option value="5">macOS Monterey</option>
            <option value="6">macOS Big Sur</option>
            <option value="7">macOS Catalina</option>
          </select>
          <select value={windowsDistro} onChange={(e) => setWindowsDistro(e.target.value)}>
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
          <button><img src={SearchIcon} className='searchIconDistroForum'/></button>
        </div>
        <Link to='/NewPost' className='newPostDistroForum'>+</Link>
      </div>
    </>
  )
}

export default DistroForum