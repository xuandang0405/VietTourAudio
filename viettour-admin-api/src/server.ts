import app from './app';
import { startSubscriptionCron } from './services/subscription-cron.service';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

if (process.env.DISABLE_CRON !== 'true') {
  startSubscriptionCron();
}
