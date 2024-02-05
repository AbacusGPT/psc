// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');

// CORS Logging Middleware
const corsLoggingMiddleware = (req, res, next) => {
  console.log('Incoming Request:', req.method, req.path);
  console.log('Origin:', req.headers.origin);
  console.log('Access-Control-Request-Method:', req.headers['access-control-request-method']);
  console.log('Access-Control-Request-Headers:', req.headers['access-control-request-headers']);
  next();
};

// app.use(corsLoggingMiddleware);

// Detailed CORS Configuration
// const corsOptions = {
//   origin: function (origin, callback) {
//       // List of allowed origins, add your frontend origin here
//       const allowedOrigins = [process.env.REACT_APP_FRONTEND_URL]; 
//       // Allow requests with no origin (like mobile apps or curl requests)
//       if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//           callback(null, true);
//       } else {
//           callback(new Error('CORS not allowed from this origin'));
//       }
//   },
//   credentials: true, // Allow sending cookies from the frontend
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   methods: ['GET', 'POST', 'OPTIONS'], // Allowed request methods
//   preflightContinue: false,
//   optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 204
// };

// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// const allowCors = fn => async (req, res) => {
//   res.setHeader('Access-Control-Allow-Credentials', true)
//   res.setHeader('Access-Control-Allow-Origin', '*')
//   // another common pattern
//   // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
//   res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
//   res.setHeader(
//     'Access-Control-Allow-Headers',
//     'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
//   )
//   if (req.method === 'OPTIONS') {
//     res.status(200).end()
//     return
//   }
//   return await fn(req, res)
// }

// const handler = (req, res) => {
//   const d = new Date()
//   res.end(d.toString())
// }

// module.exports = allowCors(handler)

// CORS Middleware
function allowCors(req, res, next) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.REACT_APP_FRONTEND_URL); // Ideally, this should not be '*', but the origin of your frontend app
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Include 'Authorization'
  if (req.method === 'OPTIONS') {
    console.log('Sending headers for OPTIONS request:', res.getHeaders());
    return res.status(200).end();
  }
  console.log('Sending headers for non-OPTIONS request:', res.getHeaders());
  next();
}

// Use the CORS middleware
app.use(allowCors);

const corsOptions = {
  origin:  process.env.REACT_APP_FRONTEND_URL, // Set this to your frontend's URL
  credentials: true,
  methods: 'GET,POST,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization'
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
