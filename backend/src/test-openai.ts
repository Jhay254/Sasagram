import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const openai = new OpenAI({
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
    } catch (error) {
        console.error('OpenAI Error:', error);
        process.exit(1);
    }
}

test();
