// Quick script to check users in the system
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  // Add your Firebase config here or use environment variables
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function checkUsers() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const usersSnapshot = await getDocs(collection(db, 'user_profiles'));
    console.log(`Found ${usersSnapshot.size} users in the system:`);
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.display_name || 'No name'} (${data.username || 'No username'}) - ${doc.id}`);
    });

    if (usersSnapshot.size <= 1) {
      console.log('\n⚠️  You need at least 2 users to test messaging!');
      console.log('💡 Try creating a second account or running the demo data script.');
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers();
