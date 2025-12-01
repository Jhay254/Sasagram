"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
async function test() {
    try {
        console.log('Testing OpenAI...');
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: 'Say hello' }],
            model: 'gpt-3.5-turbo',
            max_tokens: 5,
        });
        console.log('OpenAI Response:', completion.choices[0].message.content);
    }
    catch (error) {
        console.error('OpenAI Error:', error);
        process.exit(1);
    }
}
test();
