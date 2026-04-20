const User = require('../models/User');
const { reverseGeocodeCoordinates } = require('../utils/geocoding');
const { resolveIndiaFromGeocodeParts, isValidIndianRegion, getStateName } = require('../utils/indiaRegions');

const buildUserResponse = (user) => ({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
    city: user.city || '',
    district: user.district || '',
    stateCode: user.stateCode || '',
    state: user.state || '',
    country: user.country || 'India'
});

exports.saveUserLocation = async (req, res) => {
    try {
        if (req.user.role === 'client') {
            return res.status(403).json({ message: 'Client organizer accounts do not support attendee location preferences' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const rawLatitude = req.body.latitude;
        const rawLongitude = req.body.longitude;
        const hasCoordinates = rawLatitude !== undefined && rawLongitude !== undefined;

        if (hasCoordinates) {
            const latitude = Number(rawLatitude);
            const longitude = Number(rawLongitude);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                return res.status(400).json({ message: 'Latitude and longitude must be valid numbers' });
            }

            const geo = await reverseGeocodeCoordinates({ latitude, longitude });
            const resolved = resolveIndiaFromGeocodeParts(geo);

            user.latitude = latitude;
            user.longitude = longitude;
            user.country = resolved.country || 'India';
            user.stateCode = resolved.stateCode || '';
            user.state = resolved.state || '';
            user.district = resolved.district || '';
            user.city = resolved.city || '';
            await user.save();

            return res.json({
                message: 'Location updated successfully',
                user: buildUserResponse(user)
            });
        }

        const stateCode = String(req.body.stateCode || '').trim().toUpperCase();
        const district = String(req.body.district || '').trim();
        const city = String(req.body.city || '').trim();

        if (!stateCode || stateCode.length < 2) {
            return res.status(400).json({ message: 'Please select a state' });
        }

        if (!district) {
            return res.status(400).json({ message: 'Please select a district' });
        }

        if (!isValidIndianRegion(stateCode, district)) {
            return res.status(400).json({ message: 'District does not belong to the selected state' });
        }

        user.country = 'India';
        user.stateCode = stateCode;
        user.state = getStateName(stateCode);
        user.district = district;
        user.city = city;
        user.latitude = null;
        user.longitude = null;
        await user.save();

        return res.json({
            message: 'Location preferences updated successfully',
            user: buildUserResponse(user)
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to save user location', error: error.message });
    }
};
