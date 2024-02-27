"use client"
import React, { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import '../styles/App.css';

interface UploadResult {
  password: string;
  strength: string;
}

const App: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [strength, setStrength] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [token, setToken] = useState<string>('');
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const strengthColor: string = strength === 'strong' ? 'green' : strength === 'weak' ? 'red' : 'black';

  useEffect(() => {
    // Define the function inside the effect and then call it
    const fetchToken = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth`);
        const token = response.data.token;
        setToken(token);
        localStorage.setItem('jwtToken', token);
      } catch (error) {
        console.error("Error fetching token:", error);
      }
    };

    fetchToken();
  }, []);

  const checkPasswordStrength = async () => {
    if (!password) {
      setStrength('Password cannot be empty');
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/check-password`, { password }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      setStrength(response.data.strength);
    } catch (error) {
      console.error("Error:", error);
      setStrength('Error checking password strength.');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files ? e.target.files[0] : null);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        withCredentials: true,
      });
      setUploadResults(response.data);
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
