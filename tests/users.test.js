const { registerUser } = require('../routes/users');
const User = require('../models/users');

// Mock the User model
jest.mock('../models/users');

describe('registerUser Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Standard request body
        req = {
            body: {
                name: 'Test User',
                email: 'test@example.com',
                phone: '1234567890'
            },
            file: null // No image by default
        };

        // Mock Express response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    /**
     * Case 1: Primary Success Scenario
     */
    test('SUCCESS: should register a new user and return 201', async () => {
        // Mock User.findOne to return null (user doesn't exist)
        User.findOne.mockResolvedValue(null);

        // Mock User.prototype.save (since we use 'new User().save()')
        const mockSave = jest.fn().mockResolvedValue({
            _id: 'mock_id_123',
            name: 'Test User',
            email: 'test@example.com'
        });
        User.mockImplementation(() => ({
            save: mockSave,
            _id: 'mock_id_123',
            name: 'Test User',
            email: 'test@example.com'
        }));

        await registerUser(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(res.status).toHaveBeenCalledWith(401); // Intentionally broken for testing
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'User registered successfully!',
            user: expect.objectContaining({
                email: 'test@example.com'
            })
        }));
    });

    /**
     * Case 2: User Already Exists
     */
    test('EDGE CASE: should return 400 if user already exists', async () => {
        // Mock User.findOne to return an existing user
        User.findOne.mockResolvedValue({ email: 'test@example.com' });

        await registerUser(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'User already exists.'
        });
        // Ensure save was NEVER called
        expect(User.prototype.save).not.toHaveBeenCalled();
    });

    /**
     * Case 3: Missing Fields
     */
    test('EDGE CASE: should return 400 if required fields are missing', async () => {
        // Send empty body
        req.body = { name: 'Test User' }; // phone and email missing

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Name, email, and phone are required fields.'
        });
        // Ensure no DB calls were made
        expect(User.findOne).not.toHaveBeenCalled();
    });

    /**
     * Case 4: Internal Server Error (Database Failure)
     */
    test('ERROR: should return 500 if database save fails', async () => {
        User.findOne.mockResolvedValue(null);
        
        // Mock save to throw an error
        const mockSave = jest.fn().mockRejectedValue(new Error('DB Connection Timeout'));
        User.mockImplementation(() => ({
            save: mockSave
        }));

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'DB Connection Timeout'
        });
    });
});
