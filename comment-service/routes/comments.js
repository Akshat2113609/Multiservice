const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
});

const validateComment = (content) => {
    if (!content) {
        return { valid: false, error: 'Comment content is required' };
    }
    
    if (content.length < 1 || content.length > 1000) {
        return { valid: false, error: 'Comment must be between 1 and 1000 characters' };
    }
    
    return { valid: true };
};

router.post('/', async (req, res) => {
    const { content, blogId, userId } = req.body;
    
    if (!userId || !blogId) {
        return res.status(400).json({ error: 'Blog ID and User ID are required' });
    }
    
    const validation = validateComment(content);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO comments (
                content, 
                blog_id, 
                user_id, 
                created_at,
                upvotes,
                downvotes
            ) VALUES ($1, $2, $3, NOW(), 0, 0) 
            RETURNING *`,
            [content, blogId, userId]
        );
        
        const comment = await pool.query(`
            SELECT 
                c.*,
                u.username as author,
                (c.upvotes - c.downvotes) as score
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $1
        `, [result.rows[0].id]);
        
        res.status(201).json(comment.rows[0]);
    } catch (err) {
        console.error('Comment creation error:', err);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

router.get('/:blogId', async (req, res) => {
    const { blogId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                c.*,
                u.username as author,
                (c.upvotes - c.downvotes) as score,
                TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_date
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.blog_id = $1
            ORDER BY c.created_at DESC`,
            [blogId]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Comments fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

router.post('/:commentId/vote', async (req, res) => {
    const { commentId } = req.params;
    const { userId, voteType } = req.body;
    
    if (!userId) {
        return res.status(401).json({ error: 'User ID is required' });
    }
    
    if (!['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({ error: 'Invalid vote type' });
    }
    
    try {
        const existingVote = await pool.query(
            'SELECT * FROM comment_votes WHERE comment_id = $1 AND user_id = $2',
            [commentId, userId]
        );
        
        if (existingVote.rows.length > 0) {
            if (existingVote.rows[0].vote_type === voteType) {
                return res.status(400).json({ error: 'You have already voted' });
            }
            
            await pool.query(
                'DELETE FROM comment_votes WHERE comment_id = $1 AND user_id = $2',
                [commentId, userId]
            );
        }
        
        await pool.query(
            `INSERT INTO comment_votes (comment_id, user_id, vote_type) 
             VALUES ($1, $2, $3)`,
            [commentId, userId, voteType]
        );
        
        const updateQuery = voteType === 'upvote'
            ? 'UPDATE comments SET upvotes = upvotes + 1 WHERE id = $1'
            : 'UPDATE comments SET downvotes = downvotes + 1 WHERE id = $1';
        
        await pool.query(updateQuery, [commentId]);
        
        const updatedComment = await pool.query(`
            SELECT 
                c.*,
                u.username as author,
                (c.upvotes - c.downvotes) as score
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $1`,
            [commentId]
        );
        
        res.json(updatedComment.rows[0]);
    } catch (err) {
        console.error('Vote error:', err);
        res.status(500).json({ error: 'Failed to process vote' });
    }
});

module.exports = router;