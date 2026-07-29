import { GoogleGenAI } from '@google/genai';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini AI SDK safely on server side
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing. AI routes will return default fallback data.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// --- API ENDPOINTS ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. AI Food Recommendations
app.post('/api/ai/recommendations', async (req, res) => {
  try {
    const { mood, dietary, maxBudget, timeOfDay } = req.body;
    const ai = getAiClient();

    if (!ai) {
      return res.json({
        title: 'Chef Special Curations',
        reason: 'Handpicked top-rated dishes loved by foodies nearby.',
        suggestions: [
          'Truffle & Wild Mushroom Wood-fired Pizza',
          'Dragon Roll Supreme',
          'Royal Chicken Dum Biryani',
          'Avocado Quinoa Protein Bowl',
        ],
      });
    }

    const prompt = `You are a world-class culinary AI sommelier for "Smart Food Delivery Management System". 
Give a personalized food recommendation based on these preferences:
- Mood: ${mood || 'comfort food'}
- Dietary requirements: ${dietary || 'none'}
- Max Budget: $${maxBudget || 'any'}
- Time of Day: ${timeOfDay || 'evening dinner'}

Return a concise JSON object with key "title", key "reason", and key "suggestions" (array of 3-4 food item names or dish descriptions).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('AI Recommendations Error:', err?.message || err);
    res.json({
      title: 'Trending Delights',
      reason: 'Popular high-demand dishes curated for your taste.',
      suggestions: ['Handmade Fettuccine Carbonara', 'The Ultimate Double Smash Burger', 'Tonkotsu Black Garlic Ramen'],
    });
  }
});

// 3. AI Chat Assistant
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const ai = getAiClient();

    if (!ai) {
      return res.json({
        text: `I'm your SmartFood AI assistant! I see you said: "${message}". How can I help you choose a restaurant, track an order, or check calorie counts?`,
      });
    }

    const chat = ai.chats.create({
      model: 'gemini-3.6-flash',
      config: {
        systemInstruction: `You are FoodieBot, an upbeat and helpful AI assistant for the Smart Food Delivery Management System.
You help users with:
1. Recommending dishes and restaurants based on dietary preferences (Keto, Vegan, Halal, Gluten-Free).
2. Explaining order status, cancellation policies, and live GPS tracking.
3. Answering questions about coupons, loyalty points, and payment options (Cards, COD, QR code).
Keep responses friendly, helpful, concise, and structured with bullet points when listing foods.`,
      },
    });

    const response = await chat.sendMessage({ message: message || 'Hello!' });
    res.json({ text: response.text });
  } catch (err: any) {
    console.error('AI Chat Error:', err?.message || err);
    res.json({ text: 'I am here to help you order delicious meals! What cuisine are you craving today?' });
  }
});

// 4. Voice Command Parser
app.post('/api/ai/voice-command', async (req, res) => {
  const voiceText = req.body?.voiceText || '';
  try {
    const ai = getAiClient();

    if (!ai) {
      return res.json({
        category: 'All',
        searchKeyword: voiceText,
        maxPrice: null,
        isVegetarian: false,
      });
    }

    const prompt = `Parse this spoken user food command: "${voiceText}"
Extract structured filter fields in JSON format:
{
  "category": "All" | "Korean Food" | "Chinese Food" | "Burgers" | "Pizza" | "Asian & Sushi" | "Indian Curry" | "Healthy & Bowls" | "Desserts" | "Drinks & Smoothies",
  "searchKeyword": string or null,
  "maxPrice": number or null,
  "isVegetarian": boolean
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Voice Parser Error:', err?.message || err);
    res.json({ category: 'All', searchKeyword: voiceText, maxPrice: null, isVegetarian: false });
  }
});

// 5. AI Sales & Demand Prediction (for Restaurant / Admin Module)
app.get('/api/ai/sales-prediction', async (req, res) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || 'rest_1';
    const ai = getAiClient();

    if (!ai) {
      return res.json({
        predictedOrdersToday: 64,
        peakHour: '6:30 PM - 8:30 PM',
        topDishPrediction: 'Truffle & Wild Mushroom Wood-fired Pizza',
        recommendations: [
          'Prepare extra truffle oil and sourdough dough ahead of dinner peak.',
          'Launch 15% flash coupon between 2:00 PM - 4:00 PM to boost off-peak sales.',
        ],
      });
    }

    const prompt = `Generate a realistic AI restaurant sales prediction report for restaurant ID: ${restaurantId}.
Return JSON format with:
- "predictedOrdersToday": number (between 40 and 120)
- "peakHour": string (e.g. "7:00 PM - 9:00 PM")
- "topDishPrediction": string
- "recommendations": array of 2-3 actionable AI kitchen strategy suggestions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Sales Prediction Error:', err?.message || err);
    res.json({
      predictedOrdersToday: 55,
      peakHour: '7:00 PM - 9:00 PM',
      topDishPrediction: 'Signature Gourmet Pizza',
      recommendations: ['Increase stock for popular dinner sides.', 'Enable express preparation mode during 7-8 PM.'],
    });
  }
});

// --- VITE MIDDLEWARE & SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Smart Food Delivery Server running on http://localhost:${PORT}`);
  });
}

startServer();
