const { TourService } = require('C:/Users/UNITY/Desktop/VietTourAudio-project-ready-database-integration/server/viettour-admin-api/dist/services/poi.service.js');

async function test() {
  try {
    const service = new TourService();
    const result = await service.getTourById(3n);
    console.log('Success:', result);
    process.exit(0);
  } catch (err) {
    console.error('Failed with error:', err);
    process.exit(1);
  }
}

test();
