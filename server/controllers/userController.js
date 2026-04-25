const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const { reverseGeocodeCoordinates } = require('../utils/geocoding');
const {
    resolveIndiaFromGeocodeParts,
    isValidIndianRegion,
    getStateName
} = require('../utils/indiaRegions');

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

exports.saveUserLocation = asyncHandler(async (req, res) => {
    if (req.user.role === 'client') {
        throw new AppError(403, 'Client organizer accounts do not support attendee location preferences', {
            code: 'CLIENT_LOCATION_DISABLED'
        });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        throw new AppError(404, 'User not found', { code: 'USER_NOT_FOUND' });
    }

    const rawLatitude = req.body.latitude;
    const rawLongitude = req.body.longitude;
    const hasCoordinates = rawLatitude !== undefined && rawLongitude !== undefined;

    if (hasCoordinates) {
        const latitude = Number(rawLatitude);
        const longitude = Number(rawLongitude);
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

        return sendSuccess(res, {
            message: 'Location updated successfully',
            data: {
                user: buildUserResponse(user)
            }
        });
    }

    const stateCode = String(req.body.stateCode || '').trim().toUpperCase();
    const district = String(req.body.district || '').trim();
    const city = String(req.body.city || '').trim();

    if (!isValidIndianRegion(stateCode, district)) {
        throw new AppError(400, 'District does not belong to the selected state', {
            code: 'INVALID_REGION'
        });
    }

    user.country = 'India';
    user.stateCode = stateCode;
    user.state = getStateName(stateCode);
    user.district = district;
    user.city = city;
    user.latitude = null;
    user.longitude = null;
    await user.save();

    return sendSuccess(res, {
        message: 'Location preferences updated successfully',
        data: {
            user: buildUserResponse(user)
        }
    });
});
