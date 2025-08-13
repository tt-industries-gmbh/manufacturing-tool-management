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
  Grid,
  MenuItem,
  Typography,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { maintenanceAPI, toolsAPI } from '../services/api';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Maintenance: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<any[]>([]);
  const [overdueMaintenance, setOverdueMaintenance] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    tool_id: '',
    maintenance_type: '',
    maintenance_type_zh: '',
    description: '',
    description_zh: '',
    maintenance_date: new Date(),
    cost: 0,
    parts_replaced: '',
    parts_replaced_zh: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, upcomingRes, overdueRes, toolsRes] = await Promise.all([
        maintenanceAPI.getAll(),
        maintenanceAPI.getUpcoming(),
        maintenanceAPI.getOverdue(),
        toolsAPI.getAll(),
      ]);
      setMaintenanceRecords(recordsRes.data);
      setUpcomingMaintenance(upcomingRes.data);
      setOverdueMaintenance(overdueRes.data);
      setTools(toolsRes.data);
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      tool_id: '',
      maintenance_type: '',
      maintenance_type_zh: '',
      description: '',
      description_zh: '',
      maintenance_date: new Date(),
      cost: 0,
      parts_replaced: '',
      parts_replaced_zh: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      await maintenanceAPI.create({
        ...formData,
        maintenance_date: formData.maintenance_date.toISOString(),
      });
      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving maintenance record:', error);
    }
  };

  const getMaintenanceTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      preventive: t('maintenance.types.preventive'),
      corrective: t('maintenance.types.corrective'),
      calibration: t('maintenance.types.calibration'),
      inspection: t('maintenance.types.inspection'),
      cleaning: t('maintenance.types.cleaning'),
    };
    return types[type] || type;
  };

  const getDaysUntilMaintenance = (days: number) => {
    if (days < 0) {
      return <Chip label={`${Math.abs(Math.floor(days))} days overdue`} color="error" size="small" />;
    } else if (days <= 7) {
      return <Chip label={`${Math.floor(days)} days`} color="warning" size="small" />;
    } else {
      return <Chip label={`${Math.floor(days)} days`} color="success" size="small" />;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t('maintenance.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          {t('maintenance.addRecord')}
        </Button>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={t('maintenance.maintenanceHistory')} />
          <Tab 
            label={t('maintenance.upcomingMaintenance')} 
            icon={<ScheduleIcon />}
            iconPosition="start"
          />
          <Tab 
            label={t('maintenance.overdueTools')} 
            icon={<WarningIcon />}
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('tools.toolCode')}</TableCell>
                  <TableCell>{t('tools.toolName')}</TableCell>
                  <TableCell>{t('maintenance.maintenanceType')}</TableCell>
                  <TableCell>{t('maintenance.maintenanceDate')}</TableCell>
                  <TableCell>{t('maintenance.performedBy')}</TableCell>
                  <TableCell>{t('maintenance.cost')}</TableCell>
                  <TableCell>{t('maintenance.nextMaintenanceDate')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {maintenanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.tool_code}</TableCell>
                    <TableCell>{i18n.language === 'zh' ? record.name_zh : record.name}</TableCell>
                    <TableCell>
                      {i18n.language === 'zh' ? record.maintenance_type_zh : record.maintenance_type}
                    </TableCell>
                    <TableCell>
                      {new Date(record.maintenance_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{record.performed_by}</TableCell>
                    <TableCell>${record.cost}</TableCell>
                    <TableCell>
                      {record.next_maintenance_date
                        ? new Date(record.next_maintenance_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('tools.toolCode')}</TableCell>
                  <TableCell>{t('tools.toolName')}</TableCell>
                  <TableCell>{t('tools.condition')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell>{t('maintenance.nextMaintenanceDate')}</TableCell>
                  <TableCell>Days Until</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingMaintenance.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>{tool.tool_code}</TableCell>
                    <TableCell>{i18n.language === 'zh' ? tool.name_zh : tool.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={t(`tools.conditions.${tool.condition}`)}
                        color={tool.condition === 'good' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(`tools.statuses.${tool.status}`)}
                        color={tool.status === 'available' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(tool.next_maintenance).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getDaysUntilMaintenance(tool.days_until_maintenance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('tools.toolCode')}</TableCell>
                  <TableCell>{t('tools.toolName')}</TableCell>
                  <TableCell>{t('tools.condition')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell>{t('maintenance.nextMaintenanceDate')}</TableCell>
                  <TableCell>Days Overdue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overdueMaintenance.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>{tool.tool_code}</TableCell>
                    <TableCell>{i18n.language === 'zh' ? tool.name_zh : tool.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={t(`tools.conditions.${tool.condition}`)}
                        color="error"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(`tools.statuses.${tool.status}`)}
                        color={tool.status === 'available' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(tool.next_maintenance).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${Math.floor(tool.days_overdue)} days`}
                        color="error"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{t('maintenance.addRecord')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label={t('tools.title')}
                value={formData.tool_id}
                onChange={(e) => setFormData({ ...formData, tool_id: e.target.value })}
              >
                {tools.map((tool) => (
                  <MenuItem key={tool.id} value={tool.id}>
                    {tool.tool_code} - {i18n.language === 'zh' ? tool.name_zh : tool.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`${t('maintenance.maintenanceType')} (English)`}
                value={formData.maintenance_type}
                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`${t('maintenance.maintenanceType')} (中文)`}
                value={formData.maintenance_type_zh}
                onChange={(e) => setFormData({ ...formData, maintenance_type_zh: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label={t('maintenance.maintenanceDate')}
                value={formData.maintenance_date.toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, maintenance_date: new Date(e.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={t('maintenance.cost')}
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={`${t('maintenance.description')} (English)`}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={`${t('maintenance.description')} (中文)`}
                value={formData.description_zh}
                onChange={(e) => setFormData({ ...formData, description_zh: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={`${t('maintenance.partsReplaced')} (English)`}
                value={formData.parts_replaced}
                onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={`${t('maintenance.partsReplaced')} (中文)`}
                value={formData.parts_replaced_zh}
                onChange={(e) => setFormData({ ...formData, parts_replaced_zh: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} variant="contained">{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Maintenance;