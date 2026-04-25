const express = require('express');
const router = express.Router();
const {
    getEvents,
    getNearbyEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');
const { protect, admin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
    createEventSchema,
    eventIdSchema,
    eventQuerySchema,
    updateEventSchema
} = require('../validators/eventValidators');

router.get('/', validate(eventQuerySchema), getEvents);
router.get('/nearby', protect, validate(eventQuerySchema), getNearbyEvents);
router.get('/:id', validate(eventIdSchema), getEventById);
router.post('/', protect, admin, validate(createEventSchema), createEvent);
router.put('/:id', protect, admin, validate(updateEventSchema), updateEvent);
router.delete('/:id', protect, admin, validate(eventIdSchema), deleteEvent);

module.exports = router;
