const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  const { tool_id, upcoming } = req.query;
  let query = `
    SELECT m.*, t.tool_code, t.name, t.name_zh 
    FROM maintenance_records m
    JOIN tools t ON m.tool_id = t.id
  `;
  const params = [];

  if (tool_id) {
    query += ' WHERE m.tool_id = ?';
    params.push(tool_id);
  }

  if (upcoming === 'true') {
    const whereClause = tool_id ? ' AND' : ' WHERE';
    query += `${whereClause} m.next_maintenance_date >= date('now') 
              AND m.next_maintenance_date <= date('now', '+30 days')`;
  }

  query += ' ORDER BY m.maintenance_date DESC';

  db.all(query, params, (err, records) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch maintenance records' });
    }
    res.json(records);
  });
});

router.post('/', [
  authenticateToken,
  authorizeRole(['admin', 'supervisor']),
  body('tool_id').isInt(),
  body('maintenance_type').notEmpty(),
  body('maintenance_type_zh').notEmpty(),
  body('maintenance_date').isISO8601()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    tool_id, maintenance_type, maintenance_type_zh,
    description, description_zh, maintenance_date,
    cost = 0, parts_replaced, parts_replaced_zh
  } = req.body;

  const performed_by = req.user.username;

  db.get('SELECT maintenance_interval_days FROM tools WHERE id = ?', [tool_id], (err, tool) => {
    if (err || !tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    const next_maintenance_date = new Date(maintenance_date);
    next_maintenance_date.setDate(next_maintenance_date.getDate() + tool.maintenance_interval_days);

    db.run(`
      INSERT INTO maintenance_records (
        tool_id, maintenance_type, maintenance_type_zh,
        description, description_zh, performed_by,
        maintenance_date, next_maintenance_date, cost,
        parts_replaced, parts_replaced_zh
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tool_id, maintenance_type, maintenance_type_zh,
      description, description_zh, performed_by,
      maintenance_date, next_maintenance_date.toISOString(), cost,
      parts_replaced, parts_replaced_zh
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create maintenance record' });
      }

      db.run(`
        UPDATE tools 
        SET last_maintenance = ?, 
            next_maintenance = ?,
            condition = 'good'
        WHERE id = ?
      `, [maintenance_date, next_maintenance_date.toISOString(), tool_id], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ error: 'Failed to update tool' });
        }
        res.status(201).json({ 
          message: 'Maintenance record created successfully',
          recordId: this.lastID 
        });
      });
    });
  });
});

router.get('/upcoming', authenticateToken, (req, res) => {
  const query = `
    SELECT t.id, t.tool_code, t.name, t.name_zh, 
           t.next_maintenance, t.condition, t.status,
           julianday(t.next_maintenance) - julianday('now') as days_until_maintenance
    FROM tools t
    WHERE t.next_maintenance IS NOT NULL
      AND julianday(t.next_maintenance) - julianday('now') <= 30
    ORDER BY t.next_maintenance ASC
  `;

  db.all(query, [], (err, tools) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch upcoming maintenance' });
    }
    res.json(tools);
  });
});

router.get('/overdue', authenticateToken, (req, res) => {
  const query = `
    SELECT t.id, t.tool_code, t.name, t.name_zh, 
           t.next_maintenance, t.condition, t.status,
           julianday('now') - julianday(t.next_maintenance) as days_overdue
    FROM tools t
    WHERE t.next_maintenance IS NOT NULL
      AND julianday(t.next_maintenance) < julianday('now')
    ORDER BY days_overdue DESC
  `;

  db.all(query, [], (err, tools) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch overdue maintenance' });
    }
    res.json(tools);
  });
});

module.exports = router;