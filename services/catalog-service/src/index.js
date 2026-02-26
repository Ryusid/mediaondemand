const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'catalog-service';

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', service: SERVICE_NAME, database: 'connected' });
    } catch (error) {
        res.status(503).json({ status: 'error', service: SERVICE_NAME, database: 'disconnected' });
    }
});

// Initialize database tables
async function initDB() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS content (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'ebook')),
      format VARCHAR(20),
      s3_key VARCHAR(500),
      processed_s3_key VARCHAR(500),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
      file_size BIGINT,
      duration INTEGER,
      tags TEXT[],
      uploaded_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      -- Full-text search vector (replaces OpenSearch)
      search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
      ) STORED
    );

    -- Index for full-text search
    CREATE INDEX IF NOT EXISTS idx_content_search ON content USING GIN(search_vector);
    -- Index for filtering by type
    CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
    -- Index for filtering by status
    CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
  `);
    console.log('Database tables initialized');
}

// List all content
app.get('/api/catalog', async (req, res) => {
    try {
        const { type, status, limit = 20, offset = 0 } = req.query;
        let query = 'SELECT id, title, description, type, format, status, file_size, duration, tags, uploaded_by, created_at FROM content';
        const conditions = [];
        const params = [];

        if (type) {
            params.push(type);
            conditions.push(`type = $${params.length}`);
        }
        if (status) {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';
        params.push(parseInt(limit));
        query += ` LIMIT $${params.length}`;
        params.push(parseInt(offset));
        query += ` OFFSET $${params.length}`;

        const result = await pool.query(query, params);
        res.json({ content: result.rows, count: result.rows.length });
    } catch (error) {
        console.error('Error listing content:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single content item
app.get('/api/catalog/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM content WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Content not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create content entry
app.post('/api/catalog', async (req, res) => {
    try {
        const { title, description, type, format, s3_key, file_size, tags, uploaded_by } = req.body;
        const result = await pool.query(
            `INSERT INTO content (title, description, type, format, s3_key, file_size, tags, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [title, description, type, format, s3_key, file_size, tags || [], uploaded_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update content status by s3_key (called by processing callback)
app.patch('/api/catalog/status/update', async (req, res) => {
    try {
        const { s3_key, status, processed_s3_key, duration, format } = req.body;
        if (!s3_key) return res.status(400).json({ error: 's3_key is required' });

        const result = await pool.query(
            `UPDATE content SET status = $1, processed_s3_key = $2, duration = $3, format = $4, updated_at = NOW()
       WHERE s3_key = $5 RETURNING *`,
            [status, processed_s3_key, duration, format, s3_key]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Content with this s3_key not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating status by key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update content status by ID
app.patch('/api/catalog/:id', async (req, res) => {
    try {
        const { status, processed_s3_key, duration } = req.body;
        const result = await pool.query(
            `UPDATE content SET status = $1, processed_s3_key = $2, duration = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
            [status, processed_s3_key, duration, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Content not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete content
app.delete('/api/catalog/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM content WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Content not found' });
        }
        res.json({ deleted: true, id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`[${SERVICE_NAME}] Running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
