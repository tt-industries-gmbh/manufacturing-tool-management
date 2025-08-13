import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Chip,
  Grid,
  MenuItem,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { toolsAPI } from '../services/api';

const Tools: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [tools, setTools] = useState<any[]>([]);
  const [filteredTools, setFilteredTools] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openUsageDialog, setOpenUsageDialog] = useState(false);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [formData, setFormData] = useState({
    tool_code: '',
    name: '',
    name_zh: '',
    category: '',
    category_zh: '',
    storage_location: '',
    storage_location_zh: '',
    status: 'available',
    condition: 'good',
    maintenance_interval_days: 30,
    notes: '',
    notes_zh: '',
  });
  const [usageData, setUsageData] = useState({
    production_order: '',
    notes: '',
    notes_zh: '',
  });

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    const filtered = tools.filter(tool =>
      tool.tool_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.name_zh.includes(searchTerm)
    );
    setFilteredTools(filtered);
  }, [searchTerm, tools]);

  const fetchTools = async () => {
    try {
      const response = await toolsAPI.getAll();
      setTools(response.data);
      setFilteredTools(response.data);
    } catch (error) {
      console.error('Error fetching tools:', error);
    }
  };

  const handleOpenDialog = (tool?: any) => {
    if (tool) {
      setSelectedTool(tool);
      setFormData({
        tool_code: tool.tool_code,
        name: tool.name,
        name_zh: tool.name_zh,
        category: tool.category,
        category_zh: tool.category_zh,
        storage_location: tool.storage_location || '',
        storage_location_zh: tool.storage_location_zh || '',
        status: tool.status,
        condition: tool.condition,
        maintenance_interval_days: tool.maintenance_interval_days,
        notes: tool.notes || '',
        notes_zh: tool.notes_zh || '',
      });
    } else {
      setSelectedTool(null);
      setFormData({
        tool_code: '',
        name: '',
        name_zh: '',
        category: '',
        category_zh: '',
        storage_location: '',
        storage_location_zh: '',
        status: 'available',
        condition: 'good',
        maintenance_interval_days: 30,
        notes: '',
        notes_zh: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTool(null);
  };

  const handleSave = async () => {
    try {
      if (selectedTool) {
        await toolsAPI.update(selectedTool.id, formData);
      } else {
        await toolsAPI.create(formData);
      }
      fetchTools();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving tool:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('common.confirm'))) {
      try {
        await toolsAPI.delete(id);
        fetchTools();
      } catch (error) {
        console.error('Error deleting tool:', error);
      }
    }
  };

  const handleStartUsage = (tool: any) => {
    setSelectedTool(tool);
    setUsageData({
      production_order: '',
      notes: '',
      notes_zh: '',
    });
    setOpenUsageDialog(true);
  };

  const handleEndUsage = async (tool: any, usageId: string) => {
    try {
      await toolsAPI.endUsage(tool.id, usageId);
      fetchTools();
    } catch (error) {
      console.error('Error ending usage:', error);
    }
  };

  const handleSubmitUsage = async () => {
    try {
      await toolsAPI.startUsage(selectedTool.id, usageData);
      setOpenUsageDialog(false);
      fetchTools();
    } catch (error) {
      console.error('Error starting usage:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'in_use': return 'warning';
      case 'maintenance': return 'error';
      default: return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      case 'needs_repair': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t('tools.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('tools.addTool')}
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder={t('common.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('tools.toolCode')}</TableCell>
              <TableCell>{i18n.language === 'zh' ? t('tools.toolName') : t('tools.toolName')}</TableCell>
              <TableCell>{t('tools.category')}</TableCell>
              <TableCell>{t('tools.storageLocation')}</TableCell>
              <TableCell>{t('common.status')}</TableCell>
              <TableCell>{t('tools.condition')}</TableCell>
              <TableCell>{t('tools.nextMaintenance')}</TableCell>
              <TableCell>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTools.map((tool) => (
              <TableRow key={tool.id}>
                <TableCell>{tool.tool_code}</TableCell>
                <TableCell>{i18n.language === 'zh' ? tool.name_zh : tool.name}</TableCell>
                <TableCell>{i18n.language === 'zh' ? tool.category_zh : tool.category}</TableCell>
                <TableCell>{i18n.language === 'zh' ? tool.storage_location_zh : tool.storage_location}</TableCell>
                <TableCell>
                  <Chip
                    label={t(`tools.statuses.${tool.status}`)}
                    color={getStatusColor(tool.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={t(`tools.conditions.${tool.condition}`)}
                    color={getConditionColor(tool.condition) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {tool.next_maintenance
                    ? new Date(tool.next_maintenance).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {tool.status === 'available' && (
                      <Tooltip title={t('tools.startUsage')}>
                        <IconButton size="small" onClick={() => handleStartUsage(tool)}>
                          <PlayArrowIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton size="small" onClick={() => handleOpenDialog(tool)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(tool.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTool ? t('common.edit') : t('common.add')} {t('navigation.tools')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('tools.toolCode')}
                value={formData.tool_code}
                onChange={(e) => setFormData({ ...formData, tool_code: e.target.value })}
                disabled={!!selectedTool}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`${t('tools.toolName')} (English)`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`${t('tools.toolName')} (中文)`}
                value={formData.name_zh}
                onChange={(e) => setFormData({ ...formData, name_zh: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`${t('tools.category')} (English)`}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`${t('tools.category')} (中文)`}
                value={formData.category_zh}
                onChange={(e) => setFormData({ ...formData, category_zh: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`${t('tools.storageLocation')} (English)`}
                value={formData.storage_location}
                onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`${t('tools.storageLocation')} (中文)`}
                value={formData.storage_location_zh}
                onChange={(e) => setFormData({ ...formData, storage_location_zh: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label={t('common.status')}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="available">{t('tools.statuses.available')}</MenuItem>
                <MenuItem value="in_use">{t('tools.statuses.in_use')}</MenuItem>
                <MenuItem value="maintenance">{t('tools.statuses.maintenance')}</MenuItem>
                <MenuItem value="retired">{t('tools.statuses.retired')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label={t('tools.condition')}
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              >
                <MenuItem value="excellent">{t('tools.conditions.excellent')}</MenuItem>
                <MenuItem value="good">{t('tools.conditions.good')}</MenuItem>
                <MenuItem value="fair">{t('tools.conditions.fair')}</MenuItem>
                <MenuItem value="poor">{t('tools.conditions.poor')}</MenuItem>
                <MenuItem value="needs_repair">{t('tools.conditions.needs_repair')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={t('tools.maintenanceInterval')}
                value={formData.maintenance_interval_days}
                onChange={(e) => setFormData({ ...formData, maintenance_interval_days: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={`${t('tools.notes')} (English)`}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={`${t('tools.notes')} (中文)`}
                value={formData.notes_zh}
                onChange={(e) => setFormData({ ...formData, notes_zh: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} variant="contained">{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openUsageDialog} onClose={() => setOpenUsageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('tools.startUsage')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('tools.productionOrder')}
                value={usageData.production_order}
                onChange={(e) => setUsageData({ ...usageData, production_order: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={`${t('tools.notes')} (English)`}
                value={usageData.notes}
                onChange={(e) => setUsageData({ ...usageData, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={`${t('tools.notes')} (中文)`}
                value={usageData.notes_zh}
                onChange={(e) => setUsageData({ ...usageData, notes_zh: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUsageDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmitUsage} variant="contained">{t('common.confirm')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tools;