const mongoose = require('mongoose');
const LastMatch = require('./models/Last.model'); // adjust path if needed

// Replace with your MongoDB URI
// const MONGO_URI = 'mongodb+srv://adminadmin:adminadmin@cluster0.owboxdj.mongodb.net/?appName=Cluster0';
const MONGO_URI='mongodb+srv://dholiaisha_db_user:jS6sGRzIC0eTUY9Y@cluster0ssneh.qmtv9an.mongodb.net/?appName=Cluster0ssneh'

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    // Optional: clear existing data
    await LastMatch.deleteMany({});
    console.log('Old data removed');

    // Insert seed data
    const data = await LastMatch.create({
      last: 0
    });

    console.log('Seed data inserted:', data);

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();