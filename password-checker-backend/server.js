// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

const cors = require('cors');
// Detailed CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
      // List of allowed origins, add your frontend origin here
      const allowedOrigins = [process.env.REACT_APP_FRONTEND_URL]; 
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
      } else {
          callback(new Error('CORS not allowed from this origin'));
      }
  },
  credentials: true, // Allow sending cookies from the frontend
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'OPTIONS'], // Allowed request methods
  preflightContinue: false,
  optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Your OpenAI API key stored in .env
const SECRET_KEY = process.env.SECRET_KEY; // Use SECRET_KEY from .env
const jwt = require('jsonwebtoken');

app.use(express.json());

// Dummy authentication endpoint to get a token
app.get('/auth', (req, res) => {
  const payload = {
    user: 'user_id', // Typically, you would use user details here
    role: 'user_role' // Example role
  };
  axios.get('/auth', { withCredentials: true });
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' }); // Token expires in 1 hour

  res.send({ token });
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];

  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    req.token = bearerToken;
    jwt.verify(req.token, SECRET_KEY, (err, authData) => {
      if (err) {
        console.log("JWT Verification Error:", err.message); // Log the error message for debugging
        res.sendStatus(403); // Forbidden if token is invalid or expired
      } else {
        req.authData = authData;
        next();
      }
    });
  } else {
    res.sendStatus(401); // Unauthorized if no token is found
  }
};

app.post('/check-password', verifyToken, async (req, res) => {
  console.log(req.body); // Log the request body to see what's being received
  const password = req.body.password; // Make sure this line is present and uncommented

  const apiEndpoint = "https://api.openai.com/v1/chat/completions";

  const payload = {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: `Check if the password '${password}' is strong, or weak. Please only answer 'strong', 'weak'.` },
    ],
    model: "gpt-4",
    max_tokens: 500,
  };

  try {
    const response = await axios.post(apiEndpoint, payload, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        withCredentials: true
      },
    );

    const assistantContent = response.data.choices[0].message.content;
    res.send({ strength: assistantContent });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: 'Error checking password strength.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
