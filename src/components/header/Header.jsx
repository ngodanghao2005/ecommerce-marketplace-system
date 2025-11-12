// File: src/components/header/Header.jsx

import { Link } from 'react-router-dom'; // Import Link for navigation
import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import logoImage from '../../assets/logoBKBay.png'; // Corrected path assumption

export default function Header() {
  const [userAvatar, setUserAvatar] = useState('https://via.placeholder.com/36'); // Default placeholder
  
  // Use useEffect to fetch the random user image once when the component mounts
  useEffect(() => {
    // We will fetch a female avatar for Alice Smith
    fetch('https://randomuser.me/api/?gender=female&inc=picture') // Only include picture data
      .then(response => response.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          setUserAvatar(data.results[0].picture.thumbnail); // Use 'thumbnail' for small size
        }
      })
      .catch(error => {
        console.error("Error fetching random user avatar:", error);
        // Fallback to placeholder if fetch fails
        setUserAvatar('https://via.placeholder.com/36'); 
      });
  }, []); // Empty dependency array means this runs once on mount
  return (
    <header className="bg-white shadow-sm py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo and App Name */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-gray-900">
            <img src={logoImage} alt="BK BAY Logo" className="h-20 w-20" /> {/* Use your logo */}
            <span>BK BAY</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-8">
          <Link to="/" className="text-gray-600 hover:text-[var(--color-primary)] font-medium">Home</Link>
          <Link to="/dashboard" className="text-gray-600 hover:text-[var(--color-primary)] font-medium">Dashboard</Link>
          <Link to="/user" className="text-gray-600 hover:text-[var(--color-primary)] font-medium">User</Link>
          {/* Add more navigation links as needed */}
          <Link to="/shipper-details" className="text-gray-600 hover:text-[var(--color-primary)] font-medium">Shipper Details</Link>
          <Link to="/seller-report" className="text-gray-600 hover:text-[var(--color-primary)] font-medium">Seller Report</Link>
        </nav>

        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <span className="text-gray-700 font-medium">Alice Smith</span>
          <img
            className="h-9 w-9 rounded-full"
            src={userAvatar} // Replace with a real user avatar
            alt="User avatar"
          />
        </div>
      </div>
    </header>
  );
}