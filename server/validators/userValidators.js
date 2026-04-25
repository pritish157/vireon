const { z } = require('zod');

const coordinateSchema = z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180)
});

const regionSchema = z.object({
    stateCode: z.string().trim().min(2).max(4),
    district: z.string().trim().min(1).max(120),
    city: z.string().trim().max(80).optional().default('')
});

const saveUserLocationSchema = {
    body: z.union([coordinateSchema, regionSchema])
};

module.exports = { saveUserLocationSchema };
