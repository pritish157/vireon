const request = require('supertest');
const { app } = require('../app');

describe('Vireon backend app', () => {
    it('returns health status', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('status', 'OK');
    });

    it('returns standardized 404 payload', async () => {
        const response = await request(app).get('/api/unknown-route');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
    });

    it('validates auth payloads', async () => {
        const response = await request(app).post('/api/auth/register').send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
});
