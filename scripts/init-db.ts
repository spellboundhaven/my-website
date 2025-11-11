import { initDatabase } from '../lib/db';

async function setupDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    await initDatabase();
    console.log('✅ Database tables created successfully!');
    console.log('\nNext steps:');
    console.log('1. Go to /admin to set up pricing rules');
    console.log('2. Add your Airbnb iCal URL in settings');
    console.log('3. Test a booking!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

setupDatabase();

