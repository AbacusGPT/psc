"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Import jsonwebtoken if you're using it for token generation
const PasswordStrengthChecker_1 = require("../PasswordStrengthChecker"); // Adjust the path as necessary
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT, 10) || 8080;
// Make sure the SECRET_KEY is defined in your environment variables
const SECRET_KEY = process.env.SECRET_KEY;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.REACT_APP_FRONTEND_URL, // Use environment variable for the origin
    credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));
console.log('CORS Origin:', process.env.REACT_APP_FRONTEND_URL);
app.get('/auth', (req, res) => {
    const payload = {
        user: 'user_id',
        role: 'user_role',
    };
    // This line seems to be unnecessary and incorrect since it's not doing anything meaningful with axios here
    // axios.get('/auth', { withCredentials: true });
    const token = jsonwebtoken_1.default.sign(payload, SECRET_KEY, { expiresIn: '1h' });
    res.send({ token });
});
const passwordStrengthChecker = new PasswordStrengthChecker_1.PasswordStrengthChecker(process.env.OPENAI_API_KEY);
app.post('/check-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { password } = req.body;
    try {
        const strength = yield passwordStrengthChecker.checkStrength(password);
        res.json({ strength });
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Error checking password strength.' });
    }
}));
const upload = (0, multer_1.default)({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    const filePath = path_1.default.join(__dirname, req.file.path);
    const results = [];
    fs_1.default.createReadStream(filePath)
        .pipe((0, csv_parser_1.default)())
        .on('data', (data) => {
        results.push(data);
    })
        .on('end', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const passwordStrengths = yield Promise.all(results.map((row) => __awaiter(void 0, void 0, void 0, function* () {
                const password = row.password; // Assuming your CSV has a 'password' column
                const strength = yield passwordStrengthChecker.checkStrength(password);
                return Object.assign(Object.assign({}, row), { strength }); // Spread the row to keep other CSV data intact, if any
            })));
            fs_1.default.unlinkSync(filePath); // Clean up the uploaded file
            res.json(passwordStrengths);
        }
        catch (error) {
            console.error("Error processing file:", error);
            res.status(500).json({ error: 'Error processing file.' });
        }
    }));
}));
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map