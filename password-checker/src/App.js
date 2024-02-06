import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Import the CSS file

const App = () => {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState('');
  const [file, setFile] = useState(null); // State to hold the selected file
  const [token, setToken] = useState('');
  const [uploadResults, setUploadResults] = useState([]); // State to hold upload results
  const strengthColor = strength === 'strong' ? 'green' : strength === 'weak' ? 'red' : 'black';

  useEffect(() => {
    getToken();
  }, []);

  // Function to get token from backend
  const getToken = async () => {
    try {
      const response = await axios.get('/auth');
      setToken(response.data.token);
      localStorage.setItem('jwtToken', response.data.token); // Store token in local storage
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  };

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
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json' // Setting Content-Type 
       },
       withCredentials: true
     });
     setStrength(response.data.strength);
   } catch (error) {
     console.error("Error:", error);
     setStrength('Error checking password strength.');
   }
 };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Update the state with the selected file
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        withCredentials: true,
      });
      setUploadResults(response.data); // Assuming the backend returns an array of results
    } catch (error) {
      console.error("Error uploading file:", error);
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

      <hr />

      <h2>Upload Passwords CSV</h2>
      <input type="file" onChange={handleFileChange} accept=".csv" />
      <button onClick={handleFileUpload}>Upload and Check</button>

      {uploadResults.length > 0 && (
        <div>
          <h3>Upload Results:</h3>
          {uploadResults.map((result, index) => (
            <div key={index}>Password: {result.password}, Strength: {result.strength}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
