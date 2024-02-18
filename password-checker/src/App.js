import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Import the CSS file

const App = () => {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState('');
  const [token, setToken] = useState('');
  const strengthColor = strength === 'strong' ? 'green' : strength === 'weak' ? 'red' : 'black';


  // Function to get token from backend
  const getToken = async () => {
    try {
      //const response = await axios.get('/auth');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth`);
      setToken(response.data.token);
      localStorage.setItem('jwtToken', response.data.token); // Store token in local storage
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  };

  useEffect(() => {
    getToken();
  }, []);

  const checkPasswordStrength = async () => {

     // Check if the password is empty and return early if true
    if (!password) {
      setStrength('Password cannot be empty'); // Set strength to empty if password is empty
      return; // Stop the function from proceeding further
    }

    const backendEndpoint = `${process.env.REACT_APP_BACKEND_URL}/check-password`; // Use the full URL if your backend is hosted separately

    try {
      const response = await axios.post(backendEndpoint, { password }, {
        headers: {
          Authorization: `Bearer ${token}` // Use token in request headers
        }
      });
      setStrength(response.data.strength);
    } catch (error) {
      console.error("Error:", error);
      setStrength('Error checking password strength.');
    }
  };

  return (
    <div className="App">
    <h2>Password Strength Checker</h2>
    <input
      type="text"
      value={password}
      onChange={e => setPassword(e.target.value)}
      placeholder="Enter password"
    />
    <button onClick={checkPasswordStrength}>Check Strength</button>
    <p className="strength" style={{ color: strengthColor }}>Password Strength: {strength}</p>
  </div>
  );
};

export default App;
