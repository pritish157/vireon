const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const User = require('./models/User');

dotenv.config();

const newEvents = Array.from({ length: 10 }).map((_, i) => {
    // Dates scattered between now and 30 days from now
    const randomDays = Math.floor(Math.random() * 25) + 2; 
    const date = new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000);
    const categories = ['Technology', 'Music', 'Business', 'Art', 'Sports'];
    
    return {
        title: `Featured Showcase Event ${i + 1}`,
        description: `This is a spectacular featured event added specifically to test the Framer Motion carousel. Enjoy premium content and engaging experiences. Event ID: ${i + 1}`,
        date: date,
        location: 'Grand Exhibition Center, Local Area',
        country: 'India',
        stateCode: 'KA',
        state: 'Karnataka',
        district: 'Bangalore Urban',
        city: 'Bengaluru',
        category: categories[i % categories.length],
        totalSeats: 300,
        availableSeats: 300,
        ticketPrice: Math.floor(Math.random() * 1000),
        image: `https://images.unsplash.com/photo-${1500000000000 + i * 1000000}?auto=format&fit=crop&q=80&w=800` // Random unsplash-like ids
    };
});

const insertEvents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vireon');
        console.log('✅ Connected to MongoDB');

        // Optional: associate with an admin user if present
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            newEvents.forEach(e => e.createdBy = admin._id);
        }

        const created = await Event.insertMany(newEvents);
        console.log(`🎉 Successfully added ${created.length} new test events!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error inserting events:', err);
        process.exit(1);
    }
};

insertEvents();
