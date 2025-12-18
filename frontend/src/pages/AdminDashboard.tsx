import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    MenuItem,
    IconButton,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon, Add as AddIcon, Send as SendIcon, Visibility as VisibilityIcon, ChatBubbleOutline as CommentIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { getSurveys, createSurvey, retriggerSurvey, getSurveyStats } from '../services/surveyService';
import type { Survey } from '../services/surveyService';
import { getTemplates, type Template } from '../services/templates';

const AdminDashboard: React.FC = () => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [filterText, setFilterText] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stats, setStats] = useState({ year: 0, quarter: 0, month: 0 });

    const [open, setOpen] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    const [newSurvey, setNewSurvey] = useState({
        templateId: '',
        reference: '',
        employee: '',
        addresseeEmail: ''
    });

    useEffect(() => {
        loadSurveys();
        loadTemplates();
        loadStats();
    }, [filterStatus, startDate, endDate, filterText, filterEmployee]);

    const loadStats = async () => {
        try {
            const data = await getSurveyStats({
                ref: filterText,
                employee: filterEmployee
            });
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats', error);
        }
    };

    const loadSurveys = async () => {
        try {
            const data = await getSurveys({
                ref: filterText,
                employee: filterEmployee,
                status: filterStatus,
                startDate,
                endDate
            });
            setSurveys(data);
        } catch (error) {
            console.error('Failed to load surveys', error);
        }
    };

    const loadTemplates = async () => {
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error(error);
        }
    }

    const handleCreate = async () => {
        try {
            await createSurvey(newSurvey);
            setOpen(false);
            setNewSurvey({ templateId: '', reference: '', employee: '', addresseeEmail: '' });
            loadSurveys();
        } catch (error) {
            console.error(error);
        }
    }

    const handleRetrigger = async (id: string) => {
        try {
            await retriggerSurvey(id);
            alert('Survey email re-sent successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to re-send email');
        }
    };

    // Calculate global average for filtered surveys
    const globalAverage = surveys.reduce((acc, curr) => {
        if (curr.status === 'answered' && curr.averageScore) {
            return { sum: acc.sum + curr.averageScore, count: acc.count + 1 };
        }
        return acc;
    }, { sum: 0, count: 0 });

    const averageDisplay = globalAverage.count > 0
        ? (globalAverage.sum / globalAverage.count).toFixed(2)
        : '-';

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Dashboard</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>New Survey</Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <Box sx={{ flex: 2, width: '100%' }}>
                        <TextField
                            fullWidth
                            label="Search (Ref, Email, Employee)"
                            variant="outlined"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            onBlur={loadSurveys}
                        />
                    </Box>
                    <Box sx={{ flex: 1, width: '100%' }}>
                        <TextField
                            fullWidth
                            label="From"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </Box>
                    <Box sx={{ flex: 1, width: '100%' }}>
                        <TextField
                            fullWidth
                            label="To"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </Box>
                    <Box sx={{ flex: 1, width: '100%' }}>
                        <TextField
                            fullWidth
                            label="Employee"
                            variant="outlined"
                            value={filterEmployee}
                            onChange={(e) => setFilterEmployee(e.target.value)}
                            onBlur={loadSurveys}
                        />
                    </Box>
                    <Box sx={{ flex: 1, width: '100%' }}>
                        <TextField
                            select
                            fullWidth
                            label="Status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="open">Open</MenuItem>
                            <MenuItem value="answered">Answered</MenuItem>
                        </TextField>
                    </Box>
                    <Box>
                        <IconButton onClick={loadSurveys}><RefreshIcon /></IconButton>
                    </Box>
                </Stack>
            </Paper>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
                <Paper sx={{ p: 2, flex: 1, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="overline">Avg (Current Year)</Typography>
                    <Typography variant="h4" fontWeight="bold">{stats.year.toFixed(2)}</Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                    <Typography variant="overline">Avg (Current Quarter)</Typography>
                    <Typography variant="h4" fontWeight="bold">{stats.quarter.toFixed(2)}</Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="overline">Avg (Current Month)</Typography>
                    <Typography variant="h4" fontWeight="bold">{stats.month.toFixed(2)}</Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Typography variant="overline">Avg (Filtered)</Typography>
                    <Typography variant="h4" fontWeight="bold">{averageDisplay}</Typography>
                </Paper>
            </Stack>



            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Reference</TableCell>
                            <TableCell>Template</TableCell>
                            <TableCell>Employee</TableCell>
                            <TableCell>Addressee</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Avg Score</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {surveys.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>{row.reference}</TableCell>
                                <TableCell>{row.template?.introText.substring(0, 20)}...</TableCell>
                                <TableCell>{row.employee}</TableCell>
                                <TableCell>{row.addresseeEmail}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={row.status}
                                        color={row.status === 'answered' ? 'success' : 'warning'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{row.averageScore ? row.averageScore.toFixed(1) : '-'}</TableCell>
                                <TableCell>{format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm')}</TableCell>
                                <TableCell>
                                    {row.comment && (
                                        <Tooltip title="Has Comment">
                                            <CommentIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                                        </Tooltip>
                                    )}
                                    <IconButton onClick={() => setSelectedSurvey(row)} title="View Details" size="small">
                                        <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                    {row.status === 'open' && (
                                        <>
                                            <IconButton onClick={() => handleRetrigger(row.id)} title="Re-send Email" size="small">
                                                <SendIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton onClick={() => navigator.clipboard.writeText(`${window.location.origin}/survey/${row.id}`).then(() => alert('Link copied!'))} title="Copy Link" size="small">
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {surveys.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center">No surveys found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Trigger New Survey</DialogTitle>
                <DialogContent sx={{ minWidth: 400 }}>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Template</InputLabel>
                        <Select
                            value={newSurvey.templateId}
                            label="Template"
                            onChange={(e) => setNewSurvey({ ...newSurvey, templateId: e.target.value })}
                        >
                            {templates.map(t => (
                                <MenuItem key={t.id} value={t.id}>{t.introText.substring(0, 30)}...</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth margin="dense" label="Reference"
                        value={newSurvey.reference}
                        onChange={(e) => setNewSurvey({ ...newSurvey, reference: e.target.value })}
                    />
                    <TextField
                        fullWidth margin="dense" label="Employee"
                        value={newSurvey.employee}
                        onChange={(e) => setNewSurvey({ ...newSurvey, employee: e.target.value })}
                    />
                    <TextField
                        fullWidth margin="dense" label="Addressee Email"
                        value={newSurvey.addresseeEmail}
                        onChange={(e) => setNewSurvey({ ...newSurvey, addresseeEmail: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate}>Trigger</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!selectedSurvey} onClose={() => setSelectedSurvey(null)} maxWidth="md" fullWidth>
                <DialogTitle>Survey Details</DialogTitle>
                <DialogContent>
                    {selectedSurvey && (
                        <Box>
                            <Typography variant="subtitle1" gutterBottom><strong>Reference:</strong> {selectedSurvey.reference}</Typography>
                            <Typography variant="subtitle1" gutterBottom><strong>Employee:</strong> {selectedSurvey.employee}</Typography>
                            <Typography variant="subtitle1" gutterBottom><strong>Template:</strong> {selectedSurvey.template?.introText}</Typography>

                            <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <Typography variant="h6" gutterBottom>Comment</Typography>
                                <Typography variant="body1">{selectedSurvey.comment || 'No comment provided.'}</Typography>
                            </Box>

                            <Typography variant="h6" gutterBottom>Results</Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Question</TableCell>
                                            <TableCell align="right">Score</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedSurvey.template?.questions?.map((q: any) => {
                                            const answer = selectedSurvey.answers?.find((a: any) => a.questionId === q.id);
                                            return (
                                                <TableRow key={q.id}>
                                                    <TableCell>{q.text}</TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={answer ? answer.value : '-'}
                                                            color={answer && answer.value >= 4 ? 'success' : answer && answer.value <= 2 ? 'error' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedSurvey(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
};

export default AdminDashboard;
