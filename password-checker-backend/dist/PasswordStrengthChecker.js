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
exports.PasswordStrengthChecker = void 0;
// PasswordStrengthChecker.ts
const axios_1 = __importDefault(require("axios"));
class PasswordStrengthChecker {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiEndpoint = "https://api.openai.com/v1/chat/completions";
    }
    checkStrength(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: `Check if the password '${password}' is strong, or weak. Please only answer 'strong', 'weak'.` },
                ],
                model: "gpt-4",
                max_tokens: 500,
            };
            try {
                const response = yield axios_1.default.post(this.apiEndpoint, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                });
                return response.data.choices[0].message.content;
            }
            catch (error) {
                console.error("Error checking password strength:", error);
                throw error;
            }
        });
    }
}
exports.PasswordStrengthChecker = PasswordStrengthChecker;
//# sourceMappingURL=PasswordStrengthChecker.js.map