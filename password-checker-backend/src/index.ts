require('dotenv').config(); 
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import axios from 'axios'; // Make sure axios is imported if you're using it
import jwt from 'jsonwebtoken'; // Import jsonwebtoken if you're using it for token generation

import { PasswordStrengthChecker } from '../PasswordStrengthChecker'; // Adjust the path as necessary

const app = express();
const PORT: number = parseInt(process.env.PORT as string, 10) || 5000;

// Make sure the SECRET_KEY is defined in your environment variables
const SECRET_KEY: string = process.env.SECRET_KEY as string;

app.use(express.json());

app.use(cors({
  origin: process.env.REACT_APP_FRONTEND_URL, // Use environment variable for the origin
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));
console.log('CORS Origin:', process.env.REACT_APP_FRONTEND_URL);

app.get('/auth', (req: Request, res: Response) => {
  const payload = {
    user: 'user_id',
    role: 'user_role',
  };

  // This line seems to be unnecessary and incorrect since it's not doing anything meaningful with axios here
  // axios.get('/auth', { withCredentials: true });

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  res.send({ token });
});

const passwordStrengthChecker = new PasswordStrengthChecker(process.env.OPENAI_API_KEY as string);

app.post('/check-password', async (req: Request, res: Response) => {
  const { password } = req.body;
  try {
    const strength = await passwordStrengthChecker.checkStrength(password);
    res.json({ strength });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Error checking password strength.' });
  }
});

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const filePath = path.join(__dirname, req.file.path);
  const results: Array<{ password: string; strength?: string }> = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', async () => {
      try {
        const passwordStrengths = await Promise.all(
          results.map(async (row) => {
            const password = row.password; // Assuming your CSV has a 'password' column
            const strength = await passwordStrengthChecker.checkStrength(password);
            return { ...row, strength }; // Spread the row to keep other CSV data intact, if any
          })
        );

        fs.unlinkSync(filePath); // Clean up the uploaded file
        res.json(passwordStrengths);
      } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: 'Error processing file.' });
      }
    });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
