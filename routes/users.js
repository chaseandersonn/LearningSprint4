const User = require('../models/users');

/**
 * Controller function to register a new user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const registerUser = async (req, res) => {
    const { name, email, phone } = req.body;

    // 1. Missing form fields check
    if (!name || !email || !phone) {
        return res.status(400).json({ message: 'Name, email, and phone are required fields.' });
    }

    try {
        // 2. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // 3. Create new user
        const newUser = new User({
            name,
            email,
            phone,
            image: req.file ? req.file.filename : 'user_unknown.png'
        });

        await newUser.save();

        return res.status(201).json({
            message: 'User registered successfully!',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

module.exports = { registerUser };
