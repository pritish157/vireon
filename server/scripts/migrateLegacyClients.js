const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Client = require('../models/Client');

const migrateLegacyClients = async () => {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is required in server/.env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    try {
        const legacyClients = await User.find({ role: 'client' }).select('+password');
        if (legacyClients.length === 0) {
            console.log('No legacy client records found in User collection.');
            return;
        }

        let movedCount = 0;
        const migratedUserIds = [];

        for (const legacy of legacyClients) {
            await Client.findOneAndUpdate(
                { email: legacy.email.toLowerCase().trim() },
                {
                    $set: {
                        name: legacy.name,
                        email: legacy.email.toLowerCase().trim(),
                        password: legacy.password,
                        isVerified: legacy.isVerified ?? false,
                        resetPasswordToken: legacy.resetPasswordToken ?? null,
                        resetPasswordExpiry: legacy.resetPasswordExpiry ?? null,
                        role: 'client'
                    }
                },
                { upsert: true, new: true }
            );

            migratedUserIds.push(legacy._id);
            movedCount += 1;
        }

        if (migratedUserIds.length > 0) {
            await User.deleteMany({ _id: { $in: migratedUserIds } });
        }

        console.log(`Migrated ${movedCount} legacy client account(s) from User -> Client.`);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

migrateLegacyClients();
