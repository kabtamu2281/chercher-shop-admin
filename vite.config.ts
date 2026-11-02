import { defineConfig } from 'vite';
import { GoogleGenAI } from '@google/genai';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    configureServer(server) {
      // Healthcheck endpoint
      server.middlewares.use('/api/health', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            status: 'ok',
            system: 'Kpax Shop - Building Materials Management System',
            version: '1.0.0',
            time: new Date().toISOString(),
          }),
        );
      });

      // Lyria Music Generation endpoint
      server.middlewares.use('/api/generate-music', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const prompt =
              data.prompt ||
              'Energetic Ethiopian instrumental music with traditional masinqo, washint flute, and modern uplifting rhythm for a building materials shop in Addis Ababa';
            const model = data.model || 'lyria-3-clip-preview';

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  status: 'fallback',
                  message:
                    'GEMINI_API_KEY is not set in environment. Use procedural audio synthesis.',
                  fallback: true,
                }),
              );
              return;
            }

            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            });

            const stream = await ai.models.generateContentStream({
              model,
              contents: prompt,
            });

            const audioChunks: Buffer[] = [];
            let lyrics = '';
            let mimeType = 'audio/mpeg';

            for await (const chunk of stream) {
              const parts = chunk.candidates?.[0]?.content?.parts;
              if (!parts) continue;
              for (const part of parts) {
                if (part.inlineData?.data) {
                  if (audioChunks.length === 0 && part.inlineData.mimeType) {
                    mimeType = part.inlineData.mimeType;
                  }
                  audioChunks.push(Buffer.from(part.inlineData.data, 'base64'));
                }
                if (part.text) {
                  lyrics += part.text;
                }
              }
            }

            if (audioChunks.length === 0) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  status: 'fallback',
                  message: 'No audio returned from Lyria stream. Procedural fallback available.',
                  fallback: true,
                }),
              );
              return;
            }

            const audioBase64 = Buffer.concat(audioChunks).toString('base64');
            const audioDataUrl = `data:${mimeType};base64,${audioBase64}`;

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                status: 'success',
                audioDataUrl,
                lyrics,
                prompt,
                model,
              }),
            );
          } catch (error: any) {
            console.error('Error generating music:', error);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                status: 'error',
                message: error?.message || 'Music generation failed',
                fallback: true,
              }),
            );
          }
        });
      });
    },
  },
});
