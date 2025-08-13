const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/stats', authenticateToken, (req, res) => {
  const stats = {};

  db.get('SELECT COUNT(*) as total FROM tools', (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
    stats.totalTools = result.total;

    db.get(`SELECT COUNT(*) as available FROM tools WHERE status = 'available'`, (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch stats' });
      }
      stats.availableTools = result.available;

      db.get(`SELECT COUNT(*) as inUse FROM tools WHERE status = 'in_use'`, (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch stats' });
        }
        stats.inUseTools = result.inUse;

        db.get(`SELECT COUNT(*) as maintenance FROM tools WHERE status = 'maintenance'`, (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch stats' });
          }
          stats.maintenanceTools = result.maintenance;

          db.get(`
            SELECT COUNT(*) as upcoming 
            FROM tools 
            WHERE next_maintenance IS NOT NULL 
              AND julianday(next_maintenance) - julianday('now') BETWEEN 0 AND 7
          `, (err, result) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to fetch stats' });
            }
            stats.upcomingMaintenance = result.upcoming;

            db.get(`
              SELECT COUNT(*) as overdue 
              FROM tools 
              WHERE next_maintenance IS NOT NULL 
                AND julianday(next_maintenance) < julianday('now')
            `, (err, result) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to fetch stats' });
              }
              stats.overdueMaintenance = result.overdue;

              res.json(stats);
            });
          });
        });
      });
    });
  });
});

router.get('/tool-status-distribution', authenticateToken, (req, res) => {
  const query = `
    SELECT status, COUNT(*) as count 
    FROM tools 
    GROUP BY status
  `;

  db.all(query, [], (err, distribution) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch distribution' });
    }
    res.json(distribution);
  });
});

router.get('/tool-condition-distribution', authenticateToken, (req, res) => {
  const query = `
    SELECT condition, COUNT(*) as count 
    FROM tools 
    GROUP BY condition
  `;

  db.all(query, [], (err, distribution) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch distribution' });
    }
    res.json(distribution);
  });
});

router.get('/recent-activities', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      'usage' as type,
      u.created_at as timestamp,
      u.used_by as user,
      t.tool_code,
      t.name,
      t.name_zh,
      u.production_order as details
    FROM tool_usage u
    JOIN tools t ON u.tool_id = t.id
    WHERE u.created_at >= datetime('now', '-7 days')
    
    UNION ALL
    
    SELECT 
      'maintenance' as type,
      m.created_at as timestamp,
      m.performed_by as user,
      t.tool_code,
      t.name,
      t.name_zh,
      m.maintenance_type as details
    FROM maintenance_records m
    JOIN tools t ON m.tool_id = t.id
    WHERE m.created_at >= datetime('now', '-7 days')
    
    ORDER BY timestamp DESC
    LIMIT 20
  `;

  db.all(query, [], (err, activities) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }
    res.json(activities);
  });
});

router.get('/critical-tools', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      t.*,
      CASE 
        WHEN t.condition = 'poor' THEN 3
        WHEN julianday(t.next_maintenance) < julianday('now') THEN 2
        WHEN julianday(t.next_maintenance) - julianday('now') <= 7 THEN 1
        ELSE 0
      END as priority
    FROM tools t
    WHERE t.condition IN ('poor', 'needs_repair')
       OR (t.next_maintenance IS NOT NULL AND julianday(t.next_maintenance) - julianday('now') <= 7)
    ORDER BY priority DESC, t.next_maintenance ASC
    LIMIT 10
  `;

  db.all(query, [], (err, tools) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch critical tools' });
    }
    res.json(tools);
  });
});

module.exports = router;