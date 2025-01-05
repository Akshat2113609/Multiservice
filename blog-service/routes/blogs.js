const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
});

const validateBlogPost = (title, content) => {
    if (!title || !content) {
        return { valid: false, error: 'Title and content are required' };
    }
    
    if (title.length < 3 || title.length > 100) {
        return { valid: false, error: 'Title must be between 3 and 100 characters' };
    }
    
    if (content.length < 10 || content.length > 5000) {
        return { valid: false, error: 'Content must be between 10 and 5000 characters' };
    }
    
    return { valid: true };
};

router.post('/', async (req, res) => {
    const { title, content, userId } = req.body;
    
    if (!userId) {
        return res.status(401).json({ error: 'User ID is required' });
    }
    
    const validation = validateBlogPost(title, content);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO blogs (
                title, 
                content, 
                user_id, 
                created_at,
                updated_at, 
                upvotes, 
                downvotes
            ) VALUES ($1, $2, $3, NOW(), NOW(), 0, 0) 
            RETURNING *`,
            [title, content, userId]
        );
        
        const blog = await pool.query(`
            SELECT 
                b.*,
                u.username as author,
                (b.upvotes - b.downvotes) as score,
                TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_created_at,
                TO_CHAR(b.updated_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_updated_at
            FROM blogs b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = $1
        `, [result.rows[0].id]);
        
        res.status(201).json(blog.rows[0]);
    } catch (err) {
        console.error('Blog creation error:', err);
        res.status(500).json({ error: 'Failed to create blog post' });
    }
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                b.*,
                u.username as author,
                (b.upvotes - b.downvotes) as score,
                TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_created_at,
                TO_CHAR(b.updated_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_updated_at,
                CASE 
                    WHEN NOW() - b.created_at < INTERVAL '1 hour' 
                        THEN EXTRACT(MINUTE FROM (NOW() - b.created_at))::TEXT || ' minutes ago'
                    WHEN NOW() - b.created_at < INTERVAL '1 day' 
                        THEN EXTRACT(HOUR FROM (NOW() - b.created_at))::TEXT || ' hours ago'
                    ELSE TO_CHAR(b.created_at, 'Mon DD, YYYY')
                END as relative_time
            FROM blogs b
            JOIN users u ON b.user_id = u.id
            ORDER BY created_at DESC
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Blog fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
});

router.post('/:blogId/vote', async (req, res) => {
    const { blogId } = req.params;
    const { userId, voteType } = req.body;
    
    if (!userId) {
        return res.status(401).json({ error: 'User ID is required' });
    }
    
    if (!['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({ error: 'Invalid vote type' });
    }
    
    try {
        const existingVote = await pool.query(
            'SELECT * FROM blog_votes WHERE blog_id = $1 AND user_id = $2',
            [blogId, userId]
        );
        
        if (existingVote.rows.length > 0) {
            if (existingVote.rows[0].vote_type === voteType) {
                return res.status(400).json({ error: 'You have already voted' });
            }
            
            await pool.query(
                'DELETE FROM blog_votes WHERE blog_id = $1 AND user_id = $2',
                [blogId, userId]
            );
        }
        
        await pool.query(
            `INSERT INTO blog_votes (blog_id, user_id, vote_type, created_at) 
             VALUES ($1, $2, $3, NOW())`,
            [blogId, userId, voteType]
        );
        
        const updateQuery = voteType === 'upvote' 
            ? 'UPDATE blogs SET upvotes = upvotes + 1 WHERE id = $1'
            : 'UPDATE blogs SET downvotes = downvotes + 1 WHERE id = $1';
            
        await pool.query(updateQuery, [blogId]);
        
        const updatedBlog = await pool.query(`
            SELECT 
                b.*,
                u.username as author,
                (b.upvotes - b.downvotes) as score,
                TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_created_at,
                TO_CHAR(b.updated_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_updated_at
            FROM blogs b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = $1`,
            [blogId]
        );
        
        res.json(updatedBlog.rows[0]);
    } catch (err) {
        console.error('Vote error:', err);
        res.status(500).json({ error: 'Failed to process vote' });
    }
});

router.get('/:blogId', async (req, res) => {
    const { blogId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                b.*,
                u.username as author,
                (b.upvotes - b.downvotes) as score,
                TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_created_at,
                TO_CHAR(b.updated_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_updated_at,
                CASE 
                    WHEN NOW() - b.created_at < INTERVAL '1 hour' 
                        THEN EXTRACT(MINUTE FROM (NOW() - b.created_at))::TEXT || ' minutes ago'
                    WHEN NOW() - b.created_at < INTERVAL '1 day' 
                        THEN EXTRACT(HOUR FROM (NOW() - b.created_at))::TEXT || ' hours ago'
                    ELSE TO_CHAR(b.created_at, 'Mon DD, YYYY')
                END as relative_time
            FROM blogs b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = $1
        `, [blogId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Blog fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch blog post' });
    }
});

module.exports = router;