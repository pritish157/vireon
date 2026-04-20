const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');
const Booking = require('./models/Booking');
const {
    findStateCodeFromGeocoderState,
    findCanonicalDistrict,
    getStateName,
    isValidIndianRegion
} = require('./utils/indiaRegions');

/**
 * Ensures every seeded event matches app rules: country India, valid stateCode + district
 * from india-state-district, canonical district spelling, and full state name.
 */
const normalizeSeedEvent = (e) => {
    const country = String(e.country || 'India').trim() || 'India';
    if (country !== 'India') {
        throw new Error(`Seed event "${e.title}" must use country India (API is India-only). Got: ${country}`);
    }

    let stateCode = String(e.stateCode || '').trim().toUpperCase();
    let district = String(e.district || '').trim();
    const stateHint = String(e.state || '').trim();

    if (stateCode && isValidIndianRegion(stateCode, district)) {
        const canon = findCanonicalDistrict(stateCode, district) || district;
        return { ...e, stateCode, state: getStateName(stateCode), district: canon, country: 'India' };
    }

    const code = findStateCodeFromGeocoderState(stateHint);
    if (!code) {
        throw new Error(
            `Seed event "${e.title}": unknown Indian state "${stateHint}". Set state + stateCode to match india-state-district.`
        );
    }
    if (!district) {
        throw new Error(`Seed event "${e.title}": district is required for India events.`);
    }
    if (!isValidIndianRegion(code, district)) {
        throw new Error(
            `Seed event "${e.title}": district "${district}" is not valid for state code ${code}. Fix seed data.`
        );
    }
    const canon = findCanonicalDistrict(code, district) || district;
    return { ...e, stateCode: code, state: getStateName(code), district: canon, country: 'India' };
};

dotenv.config();

const users = [
    { name: 'Demo User', email: 'user@vireon.com', password: 'password123', role: 'user' },
    { name: 'Alice Smith', email: 'alice@vireon.com', password: 'password123', role: 'user' },
    { name: 'Bob Johnson', email: 'bob@vireon.com', password: 'password123', role: 'user' },
    { name: 'Charlie Dave', email: 'charlie@vireon.com', password: 'password123', role: 'user' },
    { name: 'Diana Prince', email: 'diana@vireon.com', password: 'password123', role: 'user' },
    { name: 'Ethan Hunt', email: 'ethan@vireon.com', password: 'password123', role: 'user' },
    { name: 'Fiona Gallagher', email: 'fiona@vireon.com', password: 'password123', role: 'user' },
    { name: 'George Miller', email: 'george@vireon.com', password: 'password123', role: 'user' },
    { name: 'Hannah Montana', email: 'hannah@vireon.com', password: 'password123', role: 'user' }
];

const events = [
    {
        title: 'React & Node.js Developer Retreat',
        description: 'Join us for a 3-day deep dive into modern full-stack web development. Perfect for developers looking to take their skills to the next level.',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        location: 'DLF Cyber Hub Convention Hall, Gurugram',
        country: 'India',
        stateCode: 'HR',
        state: 'Haryana',
        district: 'Gurugram',
        city: 'Gurugram',
        category: 'Technology',
        totalSeats: 200,
        ticketPrice: 0,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Neon Nights EDM Festival',
        description: 'Experience an unforgettable night of EDM, techno, and dazzling light shows with top DJs from around the globe.',
        date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        location: 'Vagator Beach Arena, North Goa',
        country: 'India',
        stateCode: 'GA',
        state: 'Goa',
        district: 'North Goa',
        city: 'Panaji',
        category: 'Music',
        totalSeats: 500,
        ticketPrice: 1500,
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'India Leaders Business Summit',
        description: 'A premium gathering of CEOs, founders, and investors discussing the future of commerce and AI integration across India and global markets.',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        location: 'The Leela Palace, Chanakyapuri, New Delhi',
        country: 'India',
        stateCode: 'DL',
        state: 'Delhi',
        district: 'New Delhi',
        city: 'New Delhi',
        category: 'Business',
        totalSeats: 150,
        ticketPrice: 5000,
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Modern Art Expo 2024',
        description: 'Discover breathtaking contemporary and modern arts from underground and trending artists this season.',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        location: 'National Gallery of Modern Art, Bengaluru',
        country: 'India',
        stateCode: 'KA',
        state: 'Karnataka',
        district: 'Bangalore Urban',
        city: 'Bengaluru',
        category: 'Art',
        totalSeats: 300,
        ticketPrice: 200,
        image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Startup Pitch & Funding Competition',
        description: 'Watch 25 startups pitch for seed funding. Great networking for entrepreneurs and angel investors from Gujarat and beyond.',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        location: 'Surat International Exhibition Centre',
        country: 'India',
        stateCode: 'GJ',
        state: 'Gujarat',
        district: 'Surat',
        city: 'Surat',
        category: 'Business',
        totalSeats: 250,
        ticketPrice: 100,
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Cloud Computing Architecture Seminar',
        description: 'A purely technical breakdown of scalable cloud solutions, multi-region routing, and serverless compute processing.',
        date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
        location: 'VNIT Auditorium, South Nagpur',
        country: 'India',
        stateCode: 'MH',
        state: 'Maharashtra',
        district: 'Nagpur',
        city: 'Nagpur',
        category: 'Technology',
        totalSeats: 100,
        ticketPrice: 600,
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Bhubaneswar Tech Meetup 2026',
        description: 'Connect with Odisha developers around cloud, APIs, and open source. Lightning talks, hallway track, and evening networking at a central venue.',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'KIIT Convention Centre, Patia, Bhubaneswar',
        country: 'India',
        stateCode: 'OD',
        state: 'Odisha',
        district: 'Khordha',
        city: 'Bhubaneswar',
        category: 'Technology',
        totalSeats: 180,
        ticketPrice: 0,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Rourkela Steel City Marathon',
        description: 'Half marathon and 10K through Rourkela with chip timing, hydration stations, and finisher medals. Open to runners of all levels and families.',
        date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        location: 'IG Park Stadium, Rourkela',
        country: 'India',
        stateCode: 'OD',
        state: 'Odisha',
        district: 'Sundargarh',
        city: 'Rourkela',
        category: 'Sports',
        totalSeats: 800,
        ticketPrice: 499,
        image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'India Gate Winter Music Festival',
        description: 'Outdoor indie and fusion sets near India Gate lawns. Bring blankets, enjoy street food stalls, and celebrate Delhi winter evenings with live music.',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        location: 'Rajpath Lawns, New Delhi',
        country: 'India',
        stateCode: 'DL',
        state: 'Delhi',
        district: 'New Delhi',
        city: 'Delhi',
        category: 'Music',
        totalSeats: 1200,
        ticketPrice: 799,
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Connaught Place Startup Mixer',
        description: 'Founders and investors meet over coffee in CP. Pitch tables, mentor office hours, and curated intros for early-stage Delhi NCR startups.',
        date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        location: 'The Oberoi, Connaught Place, New Delhi',
        country: 'India',
        stateCode: 'DL',
        state: 'Delhi',
        district: 'Central Delhi',
        city: 'Delhi',
        category: 'Business',
        totalSeats: 120,
        ticketPrice: 0,
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Bangalore AI & ML Summit',
        description: 'Full-day summit on generative AI, MLOps, and responsible deployment. Hands-on labs and panels with practitioners from India and abroad.',
        date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        location: 'Manyata Tech Park Auditorium, Nagavara, Bengaluru',
        country: 'India',
        stateCode: 'KA',
        state: 'Karnataka',
        district: 'Bangalore Urban',
        city: 'Bangalore',
        category: 'Technology',
        totalSeats: 400,
        ticketPrice: 1299,
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Koramangala Jazz & Blues Night',
        description: 'Intimate jazz club evening featuring local Bengaluru artists and a guest quartet. Seated dinner service and late-night jam session.',
        date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
        location: 'The Humming Tree, Koramangala, Bengaluru',
        country: 'India',
        stateCode: 'KA',
        state: 'Karnataka',
        district: 'Bangalore Urban',
        city: 'Bangalore',
        category: 'Music',
        totalSeats: 150,
        ticketPrice: 1499,
        image: 'https://images.unsplash.com/photo-1415201364774-f6fefebb5287?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Pune Product Leaders Roundtable',
        description: 'Closed-door roundtable for PMs and heads of product on roadmaps, metrics, and org design. Chatham House rules; breakfast included.',
        date: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
        location: 'Westin Pune Koregaon Park',
        country: 'India',
        stateCode: 'MH',
        state: 'Maharashtra',
        district: 'Pune',
        city: 'Pune',
        category: 'Business',
        totalSeats: 60,
        ticketPrice: 2500,
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Shaniwar Wada Heritage Walk & Concert',
        description: 'Guided heritage walk of old Pune followed by classical music in the courtyard. Supports local conservation projects.',
        date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        location: 'Shaniwar Wada, Kasba Peth, Pune',
        country: 'India',
        stateCode: 'MH',
        state: 'Maharashtra',
        district: 'Pune',
        city: 'Pune',
        category: 'Art',
        totalSeats: 200,
        ticketPrice: 350,
        image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Bandra Film & Web Series Festival',
        description: 'Screenings of independent shorts and web pilots with director Q&A. Industry passes for casting directors and production houses in Mumbai.',
        date: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
        location: 'PVR Icon, Bandra West, Mumbai',
        country: 'India',
        stateCode: 'MH',
        state: 'Maharashtra',
        district: 'Mumbai City',
        city: 'Mumbai',
        category: 'Art',
        totalSeats: 280,
        ticketPrice: 599,
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'BKC FinTech Hackathon Weekend',
        description: '48-hour hackathon on payments, credit, and regtech. Mentors from banks and startups, prizes for best demos, meals and overnight venue access.',
        date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        location: 'WeWork BKC, Bandra Kurla Complex, Mumbai',
        country: 'India',
        stateCode: 'MH',
        state: 'Maharashtra',
        district: 'Mumbai suburban',
        city: 'Mumbai',
        category: 'Technology',
        totalSeats: 320,
        ticketPrice: 0,
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Marina Beach Sunrise Yoga & Run',
        description: 'Guided yoga at dawn followed by a friendly 5K along the Marina promenade. Hydration, bananas, and certificates for all finishers.',
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        location: 'Marina Beach, Triplicane, Chennai',
        country: 'India',
        stateCode: 'TN',
        state: 'Tamil Nadu',
        district: 'Chennai',
        city: 'Chennai',
        category: 'Sports',
        totalSeats: 500,
        ticketPrice: 199,
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'HITEC City DevOps Conference',
        description: 'Two tracks on Kubernetes, observability, and platform engineering. Vendor hall, hallway conversations, and Hyderabad tech community meetup.',
        date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
        location: 'HICC, HITEC City, Hyderabad',
        country: 'India',
        stateCode: 'TG',
        state: 'Telangana',
        district: 'Hyderabad',
        city: 'Hyderabad',
        category: 'Technology',
        totalSeats: 450,
        ticketPrice: 899,
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Park Street Literary Festival',
        description: 'Author readings, poetry slams, and bilingual panels celebrating Bengali and English literature. Book stalls and signing sessions all day.',
        date: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
        location: 'Oxford Bookstore, Park Street, Kolkata',
        country: 'India',
        stateCode: 'WB',
        state: 'West Bengal',
        district: 'Kolkata',
        city: 'Kolkata',
        category: 'Art',
        totalSeats: 220,
        ticketPrice: 0,
        image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Eden Gardens T20 Fan Zone',
        description: 'Big-screen match viewing, food courts, and DJ between innings. Family zone and merchandise stalls outside the stadium on match day.',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        location: 'Eden Gardens Outer Arena, Kolkata',
        country: 'India',
        stateCode: 'WB',
        state: 'West Bengal',
        district: 'Kolkata',
        city: 'Kolkata',
        category: 'Sports',
        totalSeats: 2000,
        ticketPrice: 299,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Pink City Design Week',
        description: 'Workshops on UI, typography, and sustainable design. Portfolio reviews and studio tours across Jaipur for students and professionals.',
        date: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
        location: 'Jawahar Kala Kendra, Jaipur',
        country: 'India',
        stateCode: 'RJ',
        state: 'Rajasthan',
        district: 'Jaipur',
        city: 'Jaipur',
        category: 'Art',
        totalSeats: 160,
        ticketPrice: 450,
        image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Ahmedabad Garba Night Extravaganza',
        description: 'Traditional garba with live orchestra, costume contest, and safe family-friendly circles. Early bird tickets include dandiya sticks.',
        date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        location: 'Riverfront Event Grounds, Sabarmati, Ahmedabad',
        country: 'India',
        stateCode: 'GJ',
        state: 'Gujarat',
        district: 'Ahmedabad',
        city: 'Ahmedabad',
        category: 'Music',
        totalSeats: 3000,
        ticketPrice: 399,
        image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Marine Drive Kochi Jazz Cruise',
        description: 'Sunset cruise with acoustic jazz trio, Kerala snacks, and skyline views. Limited deck seating; life jackets and boarding assistance provided.',
        date: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
        location: 'Marine Drive Boat Jetty, Kochi',
        country: 'India',
        stateCode: 'KL',
        state: 'Kerala',
        district: 'Ernakulam',
        city: 'Kochi',
        category: 'Music',
        totalSeats: 90,
        ticketPrice: 2200,
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Indore Street Food & Startup Fair',
        description: 'Sample Indore chaat legends while meeting founders at booth demos. Pitch stage for student startups and investor office hours.',
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        location: 'Chappan Dukkan Vicinity, New Palasia, Indore',
        country: 'India',
        stateCode: 'MP',
        state: 'Madhya Pradesh',
        district: 'Indore',
        city: 'Indore',
        category: 'Business',
        totalSeats: 400,
        ticketPrice: 99,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Lucknow Ghazal Evening at Bada Imambara',
        description: 'Classical ghazal performance in the historic courtyard. Cushioned seating, winter shawls on sale, and curated Awadhi dinner packages.',
        date: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
        location: 'Bada Imambara Complex, Lucknow',
        country: 'India',
        stateCode: 'UP',
        state: 'Uttar Pradesh',
        district: 'Lucknow',
        city: 'Lucknow',
        category: 'Music',
        totalSeats: 350,
        ticketPrice: 650,
        image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Noida Cyber Hub Gaming LAN Party',
        description: 'Bring your rig or rent a station. CS2 and Valorant brackets, pizza breaks, and prize pool sponsored by local esports orgs.',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        location: 'DLF Mall of India, Sector 18, Noida',
        country: 'India',
        stateCode: 'UP',
        state: 'Uttar Pradesh',
        district: 'Gautam Buddha Nagar',
        city: 'Noida',
        category: 'Technology',
        totalSeats: 200,
        ticketPrice: 799,
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800'
    }
];

const seedDatabase = async () => {
    if (process.env.NODE_ENV === 'production') {
        console.log('❌ Seeding is disabled in production environment');
        process.exit(0);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vireon');
        console.log('\n✅ MongoDB connection open...');

        await User.deleteMany();
        await Event.deleteMany();
        await Booking.deleteMany();
        console.log('🗑️  Cleared existing data.');

        // Hash user passwords
        const salt = await bcrypt.genSalt(10);
        const hashedUsers = users.map(u => ({
            ...u,
            password: bcrypt.hashSync(u.password, salt),
            isVerified: true
        }));

        const createdUsers = await User.insertMany(hashedUsers);
        const normalUsers = createdUsers.filter(u => u.role === 'user');
        console.log(`👤 Created ${createdUsers.length} total dummy users.`);

        // Create admin user from environment variables if provided
        let adminUser = null;
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            const adminSalt = await bcrypt.genSalt(10);
            const adminHashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD, adminSalt);
            
            adminUser = await User.create({
                name: process.env.ADMIN_NAME || 'Admin User',
                email: process.env.ADMIN_EMAIL,
                password: adminHashedPassword,
                role: 'admin',
                isVerified: true
            });
            console.log('👑 Created admin user from environment variables');
        } else {
            // Create default admin for development
            const adminSalt = await bcrypt.genSalt(10);
            const defaultAdminPassword = bcrypt.hashSync('admin123', adminSalt);
            
            adminUser = await User.create({
                name: 'Admin User',
                email: 'admin@vireon.com',
                password: defaultAdminPassword,
                role: 'admin',
                isVerified: true
            });
            console.log('👑 Created default admin user (admin@vireon.com / admin123)');
        }

        // Link events to admin (canonical India state codes & district names)
        const eventsWithAdmin = events.map((e) => ({
            ...normalizeSeedEvent(e),
            availableSeats: e.totalSeats,
            createdBy: adminUser._id
        }));

        await User.findOneAndUpdate(
            { email: 'user@vireon.com' },
            {
                $set: {
                    stateCode: 'KA',
                    state: 'Karnataka',
                    district: 'Bangalore Urban',
                    city: 'Bengaluru',
                    country: 'India'
                }
            }
        );

        await User.findOneAndUpdate(
            { email: 'alice@vireon.com' },
            {
                $set: {
                    stateCode: 'OD',
                    state: 'Odisha',
                    district: 'Khordha',
                    city: 'Bhubaneswar',
                    country: 'India'
                }
            }
        );

        await User.findOneAndUpdate(
            { email: 'bob@vireon.com' },
            {
                $set: {
                    stateCode: 'DL',
                    state: 'Delhi',
                    district: 'Central Delhi',
                    city: 'Delhi',
                    country: 'India'
                }
            }
        );

        const createdEvents = await Event.insertMany(eventsWithAdmin);
        console.log(`🎉 Created ${createdEvents.length} distinct events with Unsplash images.`);

        // Generate Bookings Data
        const bookingsData = [];

        for (const event of createdEvents) {
            // Assign 3-6 random users to each event
            const randomCount = Math.floor(Math.random() * 4) + 3;
            // Shuffle and pick random users
            const shuffledUsers = [...normalUsers].sort(() => 0.5 - Math.random());
            const selectedUsers = shuffledUsers.slice(0, randomCount);

            for (const user of selectedUsers) {
                // Randomize statuses
                const statuses = ['pending', 'confirmed', 'cancelled'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                let paymentStatus = 'not_paid';
                if (status === 'confirmed' && event.ticketPrice > 0) {
                    // Usually confirmed tickets are marked paid (90% of the time)
                    paymentStatus = Math.random() > 0.1 ? 'paid' : 'not_paid';
                } else if (event.ticketPrice === 0) {
                    paymentStatus = 'paid';
                }

                bookingsData.push({
                    userId: user._id,
                    eventId: event._id,
                    status: status,
                    paymentStatus: paymentStatus,
                    amount: event.ticketPrice
                });

                // Deduct available seats specifically for confirmed tickets!
                if (status === 'confirmed') {
                    event.availableSeats -= 1;
                    await event.save();
                }
            }
        }

        await Booking.insertMany(bookingsData);
        console.log(`🎫 Inserted ${bookingsData.length} randomized dummy bookings (confirmed, pending, cancelled, paid, not_paid).`);

        console.log('\n🚀 Database seeded successfully!');
        console.log('-------------------------------------------');
        if (process.env.ADMIN_EMAIL) {
            console.log(`Admin Email: ${process.env.ADMIN_EMAIL}`);
        } else {
            console.log('Admin Email: admin@vireon.com');
            console.log('Admin Password: admin123');
        }
        console.log('User Email: user@vireon.com');
        console.log('User Password: password123');
        console.log('-------------------------------------------\n');

        process.exit();
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase, normalizeSeedEvent, events };
