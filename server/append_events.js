const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'seed.js');
let seedContent = fs.readFileSync(seedPath, 'utf8');

const categories = ['Technology', 'Music', 'Business', 'Art', 'Sports'];
const locations = [
    { location: 'Grand Exhibition Center', stateCode: 'KA', state: 'Karnataka', district: 'Bangalore Urban', city: 'Bengaluru' },
    { location: 'Cyber Hub Convention Hall', stateCode: 'HR', state: 'Haryana', district: 'Gurugram', city: 'Gurugram' },
    { location: 'Bandra Kurla Complex', stateCode: 'MH', state: 'Maharashtra', district: 'Mumbai suburban', city: 'Mumbai' },
    { location: 'HITEC City', stateCode: 'TG', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad' },
    { location: 'Connaught Place', stateCode: 'DL', state: 'Delhi', district: 'New Delhi', city: 'Delhi' }
];

let generatedEvents = [];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth(); // May is 4
const monthsLeft = 11 - currentMonth + 1; // 8 months
let eventCounter = 1;

for (let i = 0; i < 50; i++) {
    const targetMonthOffset = Math.floor(i / (50 / monthsLeft));
    const targetMonth = currentMonth + targetMonthOffset;
    
    let targetDay = Math.floor(Math.random() * 28) + 1;
    const eventDate = new Date(currentYear, targetMonth, targetDay);
    
    if (eventDate <= new Date()) {
        eventDate.setDate(new Date().getDate() + 1);
    }

    const loc = locations[i % locations.length];
    const cat = categories[i % categories.length];

    generatedEvents.push(`    {
        title: 'Mega Featured Showcase ${eventCounter++}',
        description: 'An exclusive ${cat} event happening this month. Join us for premium networking, showcases, and incredible experiences.',
        date: new Date("${eventDate.toISOString()}"),
        location: '${loc.location}',
        country: 'India',
        stateCode: '${loc.stateCode}',
        state: '${loc.state}',
        district: '${loc.district}',
        city: '${loc.city}',
        category: '${cat}',
        totalSeats: 500,
        ticketPrice: ${Math.floor(Math.random() * 1500)},
        image: 'https://images.unsplash.com/photo-${1500000000000 + i * 100000}?auto=format&fit=crop&q=80&w=800'
    }`);
}

const insertionString = ",\n" + generatedEvents.join(",\n") + "\n];";

// Find the end of the events array. It's just before `const seedDatabase = async () => {`
// Let's replace `];\n\nconst seedDatabase` with the insertion
seedContent = seedContent.replace(/];\s*const seedDatabase/, insertionString + '\n\nconst seedDatabase');

fs.writeFileSync(seedPath, seedContent, 'utf8');
console.log('Successfully appended 50 events to seed.js');
