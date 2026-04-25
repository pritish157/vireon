process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '5001';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vireon-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_for_vireon_backend';
