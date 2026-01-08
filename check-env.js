// Quick script to verify environment variables are set
// Run with: node check-env.js

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('\nPlease create a .env.local file with:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

const env = {};
lines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

console.log('📋 Environment Variables Check:\n');

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let allPresent = true;
required.forEach(key => {
  const value = env[key];
  if (value && value.length > 0 && value !== 'your_' + key.toLowerCase().replace(/next_public_|supabase_/g, '').replace(/_/g, '_')) {
    console.log(`✅ ${key}: Set (${value.length} chars)`);
  } else {
    console.log(`❌ ${key}: Missing or not set`);
    allPresent = false;
  }
});

if (allPresent) {
  console.log('\n✅ All environment variables are set!');
  console.log('\n⚠️  Make sure to restart your dev server after setting/updating .env.local:');
  console.log('   1. Stop the current dev server (Ctrl+C)');
  console.log('   2. Run: npm run dev');
} else {
  console.log('\n❌ Some environment variables are missing!');
  console.log('Please check SETUP.md for instructions on how to set them up.');
  process.exit(1);
}
