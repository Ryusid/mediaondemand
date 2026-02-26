const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'search-service';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', service: SERVICE_NAME });
    } catch {
        res.status(503).json({ status: 'error', service: SERVICE_NAME });
    }
});

// Full-text search using PostgreSQL tsvector
app.get('/api/search', async (req, res) => {
    try {
        const { q, type, status, limit = 20, offset = 0 } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        let query = `
      SELECT id, title, description, type, format, status, tags, created_at,
             ts_rank(search_vector, plainto_tsquery('english', $1)) AS relevance
      FROM content
      WHERE search_vector @@ plainto_tsquery('english', $1)
    `;
        const params = [q];

        if (type) {
            params.push(type);
            query += ` AND type = $${params.length}`;
        }
        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }

        query += ` ORDER BY relevance DESC`;
        params.push(parseInt(limit));
        query += ` LIMIT $${params.length}`;
        params.push(parseInt(offset));
        query += ` OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            query: q,
            results: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('Error searching content:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search suggestions (autocomplete)
app.get('/api/search/suggest', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

        const result = await pool.query(
            `SELECT DISTINCT title FROM content
       WHERE title ILIKE $1
       ORDER BY title LIMIT 10`,
            [`%${q}%`]
        );

        res.json({ suggestions: result.rows.map(r => r.title) });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Running on port ${PORT}`);
});
