const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  const query = `
    SELECT t.*, 
           COUNT(DISTINCT u.id) as total_usage,
           MAX(u.start_time) as last_usage_time
    FROM tools t
    LEFT JOIN tool_usage u ON t.id = u.tool_id
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `;
  
  db.all(query, [], (err, tools) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch tools' });
    }
    res.json(tools);
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  const query = `
    SELECT t.*, 
           COUNT(DISTINCT u.id) as total_usage,
           COUNT(DISTINCT m.id) as total_maintenance
    FROM tools t
    LEFT JOIN tool_usage u ON t.id = u.tool_id
    LEFT JOIN maintenance_records m ON t.id = m.tool_id
    WHERE t.id = ?
    GROUP BY t.id
  `;
  
  db.get(query, [req.params.id], (err, tool) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch tool' });
    }
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.json(tool);
  });
});

router.post('/', [
  authenticateToken,
  authorizeRole(['admin', 'supervisor']),
  body('tool_code').notEmpty().trim(),
  body('name').notEmpty().trim(),
  body('name_zh').notEmpty().trim(),
  body('category').notEmpty().trim(),
  body('category_zh').notEmpty().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    tool_code, name, name_zh, category, category_zh,
    storage_location, storage_location_zh, status = 'available',
    condition = 'good', maintenance_interval_days = 30,
    notes, notes_zh
  } = req.body;

  const query = `
    INSERT INTO tools (
      tool_code, name, name_zh, category, category_zh,
      storage_location, storage_location_zh, status, condition,
      maintenance_interval_days, notes, notes_zh
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    tool_code, name, name_zh, category, category_zh,
    storage_location, storage_location_zh, status, condition,
    maintenance_interval_days, notes, notes_zh
  ], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Tool code already exists' });
      }
      return res.status(500).json({ error: 'Failed to create tool' });
    }
    res.status(201).json({ 
      message: 'Tool created successfully',
      toolId: this.lastID 
    });
  });
});

router.put('/:id', [
  authenticateToken,
  authorizeRole(['admin', 'supervisor'])
], (req, res) => {
  const {
    name, name_zh, category, category_zh,
    storage_location, storage_location_zh, status,
    condition, maintenance_interval_days, notes, notes_zh
  } = req.body;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (name_zh !== undefined) { updates.push('name_zh = ?'); values.push(name_zh); }
  if (category !== undefined) { updates.push('category = ?'); values.push(category); }
  if (category_zh !== undefined) { updates.push('category_zh = ?'); values.push(category_zh); }
  if (storage_location !== undefined) { updates.push('storage_location = ?'); values.push(storage_location); }
  if (storage_location_zh !== undefined) { updates.push('storage_location_zh = ?'); values.push(storage_location_zh); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (condition !== undefined) { updates.push('condition = ?'); values.push(condition); }
  if (maintenance_interval_days !== undefined) { updates.push('maintenance_interval_days = ?'); values.push(maintenance_interval_days); }
  if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
  if (notes_zh !== undefined) { updates.push('notes_zh = ?'); values.push(notes_zh); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);

  const query = `UPDATE tools SET ${updates.join(', ')} WHERE id = ?`;

  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update tool' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.json({ message: 'Tool updated successfully' });
  });
});

router.delete('/:id', [
  authenticateToken,
  authorizeRole(['admin'])
], (req, res) => {
  db.run('DELETE FROM tools WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete tool' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.json({ message: 'Tool deleted successfully' });
  });
});

router.post('/:id/usage', [
  authenticateToken,
  body('production_order').optional().trim(),
  body('notes').optional().trim(),
  body('notes_zh').optional().trim()
], (req, res) => {
  const { production_order, notes, notes_zh } = req.body;
  const tool_id = req.params.id;
  const used_by = req.user.username;

  db.run(`
    INSERT INTO tool_usage (tool_id, used_by, production_order, start_time, notes, notes_zh)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
  `, [tool_id, used_by, production_order, notes, notes_zh], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to record usage' });
    }

    db.run(`
      UPDATE tools 
      SET status = 'in_use', 
          last_used = CURRENT_TIMESTAMP,
          usage_count = usage_count + 1
      WHERE id = ?
    `, [tool_id], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ error: 'Failed to update tool status' });
      }
      res.status(201).json({ 
        message: 'Usage recorded successfully',
        usageId: this.lastID 
      });
    });
  });
});

router.put('/:id/usage/:usageId/end', authenticateToken, (req, res) => {
  const { id: tool_id, usageId } = req.params;

  db.run(`
    UPDATE tool_usage 
    SET end_time = CURRENT_TIMESTAMP 
    WHERE id = ? AND tool_id = ? AND end_time IS NULL
  `, [usageId, tool_id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to end usage' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usage record not found or already ended' });
    }

    db.run(`
      UPDATE tools 
      SET status = 'available' 
      WHERE id = ?
    `, [tool_id], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ error: 'Failed to update tool status' });
      }
      res.json({ message: 'Usage ended successfully' });
    });
  });
});

module.exports = router;