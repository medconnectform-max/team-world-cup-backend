const mongoose = require('mongoose');
const LastMatch = require('./models/Last.model'); // adjust path if needed

// Replace with your MongoDB URI


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