import { fastifyMultipart } from '@fastify/multipart';
import { FastifyInstance } from "fastify";
import fs from 'fs'
import { pipeline } from 'stream';
import path from 'path';
import { randomUUID } from 'crypto';
import { promisify } from 'util';

const pump = promisify(pipeline);

export async function uploadVideo(app: FastifyInstance){
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1048576 * 25 // 25mb
    }
  });

  app.post('/videos', async (request, reply) => {
    const data = await request.file();

    if(!data) {
      return reply.status(400).send({ error: 'Missing file input.' });
    }

    const extension = path.extname(data.filename);

    if(extension !== '.mp3') {
      return reply.status(400).send({ error: 'Invalid input type. Should be must .mp3 extension' });
    }

    const fileBaseName = path.basename(data.fieldname, extension);

    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`;

    const uploadDestination = path.resolve(__dirname,'..', '..', 'tmp', fileUploadName);

    await pump(data.file, fs.createWriteStream(uploadDestination));

    return reply.send();
  });
}
