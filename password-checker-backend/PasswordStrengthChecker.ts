// PasswordStrengthChecker.ts
import axios from 'axios';

export class PasswordStrengthChecker {
  private apiKey: string;
  private apiEndpoint: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiEndpoint = "https://api.openai.com/v1/chat/completions";
  }

  public async checkStrength(password: string): Promise<string> {
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

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error checking password strength:", error);
      throw error;
    }
  }
}
