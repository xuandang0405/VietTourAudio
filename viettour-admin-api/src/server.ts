import 'dotenv/config';
import app from './app';
import { pingDatabase } from './lib/db';

const PORT = Number(process.env.PORT ?? 5001);

async function start() {
  try {
    await pingDatabase();
    app.listen(PORT, () => {
      console.log(`Admin API is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Admin API cannot connect to the VietTourAudio database.', error);
    process.exitCode = 1;
  }
}

void start();
