import 'dotenv/config';
import cron from 'node-cron';
import app from './app';
import { pingDatabase } from './lib/db';
import { processDueVendorSubscriptions } from './services/vendor-wallet.service';

const PORT = Number(process.env.PORT ?? 5001);

async function start() {
  try {
    await pingDatabase();
    app.listen(PORT, () => {
      console.log(`Admin API is running on http://localhost:${PORT}`);
    });
    void processDueVendorSubscriptions().catch((error) => {
      console.error('Initial vendor billing run failed:', error);
    });
    cron.schedule('15 * * * *', () => {
      void processDueVendorSubscriptions().catch((error) => {
        console.error('Scheduled vendor billing run failed:', error);
      });
    });
  } catch (error) {
    console.error('Admin API cannot connect to the VietTourAudio database.', error);
    process.exitCode = 1;
  }
}

void start();
