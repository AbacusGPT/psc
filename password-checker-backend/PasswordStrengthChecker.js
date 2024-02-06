const axios = require('axios');

class PasswordStrengthChecker {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiEndpoint = "https://api.openai.com/v1/chat/completions";
    }

    async checkStrength(password) {
        const payload = {
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: `Check if the password '${password}' is strong, or weak. Please only answer 'strong', 'weak'.` },
            ],
            model: "gpt-4",
            max_tokens: 500,
        };

        try {
            const response = await axios.post(this.apiEndpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });

            return response.data.choices[0].message.content; // Return the strength directly
        } catch (error) {
            console.error("Error checking password strength:", error);
            throw error; // Rethrow the error to handle it in the calling function
        }
    }
}

module.exports = PasswordStrengthChecker;