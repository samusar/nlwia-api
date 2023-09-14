import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { createReadStream } from "fs";
import { z } from 'zod';
import { openai } from "../lib/openai";

export async function createTranscription(app: FastifyInstance){

  app.post('/videos/:videoId/transcription', async (request) => {
    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    });

    const { videoId } = paramsSchema.parse(request.params);

    const bodySchema = z.object({
      prompt: z.string(),
    });

    const { prompt } = bodySchema.parse(request.body);

    const video = await prisma.video.findFirstOrThrow({
      where: {
        id: videoId,
      }
    });

    const videoPath = video.path;

    const audioRedStream = createReadStream(videoPath);

    const response = await openai.audio.transcriptions.create({
      file: audioRedStream,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json',
      temperature: 0.2,
      prompt,
    });

    const transcription = response.text;

    await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        transcription,
      }
    })

    return { transcription };
  });
}