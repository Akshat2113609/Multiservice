const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
});

const validateInput = (username, password) => {
    if (!username || !password) {
        return { valid: false, error: 'Username and password are required' };
    }
    
    if (username.length < 3 || username.length > 30) {
        return { valid: false, error: 'Username must be between 3 and 30 characters' };
    }
    
    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters' };
    }
    
    return { valid: true };
};

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    const validation = validateInput(username, password);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }
    
    try {
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO users (username, password, created_at) VALUES ($1, $2, NOW()) RETURNING id',
            [username, hashedPassword]
        );
        
        res.status(201).json({ 
            userId: result.rows[0].id,
            message: 'Registration successful'
        });
        
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const validation = validateInput(username, password);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }
    
    try {
        const result = await pool.query(
            'SELECT id, username, password FROM users WHERE username = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(password, result.rows[0].password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [result.rows[0].id]
        );
        
        res.json({
            userId: result.rows[0].id,
            message: 'Login successful'
        });
        
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;