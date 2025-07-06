import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { fal } from "@fal-ai/client";
import OpenAI from "openai";
import { ImageData } from './types';

import cors from 'cors';
import { PostgreSQLFavoritesService } from './favoritesService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const favoritesService = new PostgreSQLFavoritesService();

async function generatePromptVariations(prompt: string): Promise<string[]> {
  console.log('generating prompt variations for: ', prompt);
  // use openai to generate 4 variations of the prompt
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 1.4,
    messages: [
      {
        role: "system",
        content:
          "You are a creative prompt engineer for text-to-image models. \
          Return 4 short variations of the prompt given with no explanation  \
          or other text. Each variation should intend to produce an image in a \
          different style than the original prompt. Separate each variation with a new line.",
      },
      { role: "user", content: prompt },
    ],
  });
  console.log(res.choices.map((c) => c.message.content!.trim()));
  return res.choices[0].message.content?.split('\n').filter((line) => line.trim() !== '').map((line) => line.trim()) || [];
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'ImageGen Backend Server is running',
    endpoints: ['/api/image', '/api/favorites']
  });
});

// Image endpoint
app.post('/api/image', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  console.log('incoming prompt: ', prompt, ' body: ', req.body);

  try {
    const [promptVariations, falResult] = await Promise.all([
      generatePromptVariations(prompt),
      fal.subscribe("fal-ai/flux/schnell", {
        input: {
          prompt: prompt,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      })
    ]);
    console.log(falResult.data);
    console.log(falResult.requestId);
    const imageUrl = falResult.data.images[0].url;
    res.json({
      prompt: prompt,
      imageUrl: imageUrl,
      variations: promptVariations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error generating image',
      error: error
    });
  }
});

// Favorites endpoint
app.get('/api/favorites', async (_req: Request, res: Response) => {
  // TODO: make this user specific
  // TODO: add pagination
  const favorites = await favoritesService.getFavorites();
  res.json({
    favorites: favorites,
  });
});

app.post('/api/favorites', async (req: Request, res: Response) => {
  console.log('Adding to favorites:', req.body);
  try {
    const imageData  = req.body as ImageData;
    await favoritesService.addFavorite(imageData);
    res.json({
      message: 'Added to favorites',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error adding to favorites',
      error: error
    });
  }
});

app.delete('/api/favorites/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await favoritesService.removeFavorite(id);
  res.json({
    message: 'Removed from favorites',
    deletedId: id,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: ['/', '/api/image', '/api/favorites']
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Export the app for Lambda handler
module.exports = app;

// Only start the server if running locally (not in Lambda)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📝 Available endpoints:`);
    console.log(`   GET  /           - Health check`);
    console.log(`   GET  /api/image      - Get image info`);
    console.log(`   POST /api/image      - Generate image`);
    console.log(`   GET  /api/favorites  - Get favorites list`);
    console.log(`   POST /api/favorites  - Add to favorites`);
    console.log(`   DELETE /api/favorites/:id - Remove from favorites`);
  });
} 