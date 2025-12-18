import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    TextField,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    FormControlLabel,
    IconButton,
    Alert,
    Tooltip
} from '@mui/material';
import { Delete as DeleteIcon, ContentCopy as CopyIcon, Add as AddIcon } from '@mui/icons-material';
import { getSettings, saveSettings, sendTestEmail, getApiKeys, createApiKey, deleteApiKey } from '../services/settings';
import type { ApiKey } from '../services/settings';
import { getUsers, createUser } from '../services/users';
import type { User } from '../services/users';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const Settings: React.FC = () => {
    const [value, setValue] = useState(0);
    const [smtp, setSmtp] = useState({ host: '', port: '', user: '', pass: '', secure: 'false', tls_reject: 'true', app_url: '', sender_name: '' });
    const [testEmail, setTestEmail] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [openUser, setOpenUser] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'USER' });

    // API Keys state
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [openApiKey, setOpenApiKey] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        loadSettings();
        loadUsers();
        loadApiKeys();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users');
        }
    }

    const loadApiKeys = async () => {
        try {
            const data = await getApiKeys();
            setApiKeys(data);
        } catch (error) {
            console.error('Failed to load API keys');
        }
    }

    const handleCreateUser = async () => {
        try {
            await createUser(newUser);
            setOpenUser(false);
            setNewUser({ email: '', password: '', role: 'USER' });
            loadUsers();
        } catch (error) {
            alert('Failed to create user');
        }
    };

    const handleCreateApiKey = async () => {
        try {
            const data = await createApiKey(newKeyName);
            setCreatedKey(data.rawKey || null);
            setNewKeyName('');
            loadApiKeys();
            // Don't close dialog yet, show the key
        } catch (error) {
            alert('Failed to create API key');
        }
    };

    const handleDeleteApiKey = async (id: string) => {
        if (!confirm('Are you sure you want to delete this API key?')) return;
        try {
            await deleteApiKey(id);
            loadApiKeys();
        } catch (error) {
            alert('Failed to delete API key');
        }
    };

    const loadSettings = async () => {
        try {
            const data = await getSettings();
            setSmtp(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    };

    const handleSave = async () => {
        try {
            await saveSettings(smtp);
            alert('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Failed to save settings');
        }
    };

    const handleTestEmail = async () => {
        try {
            if (!testEmail) return alert('Please enter a recipient email');
            await sendTestEmail(testEmail);
            alert('Test email sent successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to send test email');
        }
    };

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const copyToClipboard = async (text: string) => {
        console.log('copyToClipboard called with:', text);

        // Method 1: Try modern Clipboard API first (most reliable)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                console.log('Clipboard API succeeded');
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
                return;
            } catch (err) {
                console.log('Clipboard API failed, trying fallback:', err);
            }
        }

        // Method 2: Fallback using textarea (more compatible than input)
        const textarea = document.createElement('textarea');
        textarea.value = text;
        // Make it visible but small - some browsers don't copy from hidden elements
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '1px';
        textarea.style.height = '1px';
        textarea.style.padding = '0';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
        textarea.style.background = 'transparent';
        textarea.style.opacity = '0.01';
        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        try {
            const result = document.execCommand('copy');
            console.log('execCommand result:', result);
            if (result) {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } else {
                // execCommand returned false - show manual copy prompt
                window.prompt('Copy this API key:', text);
            }
        } catch (err) {
            console.error('execCommand error:', err);
            // Last resort - show prompt dialog for manual copy
            window.prompt('Copy this API key:', text);
        }

        document.body.removeChild(textarea);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Settings</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="settings tabs">
                    <Tab label="System / SMTP" />
                    <Tab label="User Management" />
                    <Tab label="API Keys" />
                </Tabs>
            </Box>

            {/* SYSTEM SETTINGS */}
            <CustomTabPanel value={value} index={0}>
                <Paper sx={{ p: 3, maxWidth: 600 }}>
                    <Typography variant="h6" gutterBottom>General Configuration</Typography>
                    <TextField
                        fullWidth
                        label="Application URL"
                        margin="normal"
                        placeholder="http://example.com"
                        value={smtp.app_url || ''}
                        onChange={(e) => setSmtp({ ...smtp, app_url: e.target.value })}
                        helperText="Base URL for survey links (e.g. https://feedback.yourcompany.com)"
                    />
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>SMTP Configuration</Typography>
                    <TextField fullWidth label="Host" margin="normal" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} />
                    <TextField fullWidth label="Port" margin="normal" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} />
                    <TextField fullWidth label="User" margin="normal" value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} />
                    <TextField fullWidth label="Password" type="password" margin="normal" value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} />
                    <TextField
                        fullWidth
                        label="Sender Name"
                        margin="normal"
                        value={smtp.sender_name || ''}
                        onChange={(e) => setSmtp({ ...smtp, sender_name: e.target.value })}
                        helperText="Display name for outgoing emails (e.g. 'Feedback System')"
                    />

                    <FormControlLabel
                        control={<Checkbox checked={smtp.secure === 'true'} onChange={(e) => setSmtp({ ...smtp, secure: String(e.target.checked) })} />}
                        label="Use TLS/SSL (Secure)"
                    />
                    <br />
                    <FormControlLabel
                        control={<Checkbox checked={smtp.tls_reject !== 'false'} onChange={(e) => setSmtp({ ...smtp, tls_reject: String(e.target.checked) })} />}
                        label="Reject Unauthorized (Verify Certificate)"
                    />
                    <br />
                    <Button variant="contained" sx={{ mt: 2 }} onClick={handleSave}>Save Settings</Button>

                    <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>Test Email</Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                            label="Recipient Email"
                            size="small"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            sx={{ flex: 1 }}
                        />
                        <Button variant="outlined" onClick={handleTestEmail}>Send Test</Button>
                    </Box>
                </Paper>
            </CustomTabPanel>

            {/* USER MANAGEMENT */}
            <CustomTabPanel value={value} index={1}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenUser(true)}>Add User</Button>
                </Box>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.email}</TableCell>
                                    <TableCell>{row.role}</TableCell>
                                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell align="right">
                                        <Button size="small">Edit</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CustomTabPanel>

            {/* API KEYS */}
            <CustomTabPanel value={value} index={2}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setCreatedKey(null); setOpenApiKey(true); }}>Create API Key</Button>
                </Box>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Last Used</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {apiKeys.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>{row.lastUsed ? new Date(row.lastUsed).toLocaleString() : 'Never'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton color="error" onClick={() => handleDeleteApiKey(row.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CustomTabPanel>

            {/* ADD USER DIALOG */}
            <Dialog open={openUser} onClose={() => setOpenUser(false)}>
                <DialogTitle>Add New User</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense" label="Email" fullWidth
                        value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                    <TextField
                        margin="dense" label="Password" type="password" fullWidth
                        value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    <TextField
                        select label="Role" fullWidth margin="dense"
                        value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        SelectProps={{ native: true }}
                    >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUser(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateUser}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* ADD API KEY DIALOG */}
            <Dialog open={openApiKey} onClose={() => setOpenApiKey(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogContent>
                    {!createdKey ? (
                        <TextField
                            margin="dense" label="Key Name" fullWidth
                            value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
                            helperText="Give this key a name (e.g. 'External Integration')"
                        />
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                API Key Created! Copy it now, you won't see it again.
                            </Alert>
                            {copySuccess && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Copied to clipboard!
                                </Alert>
                            )}
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    bgcolor: 'grey.100',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'grey.200' }
                                }}
                                onClick={() => copyToClipboard(createdKey)}
                            >
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontFamily: 'monospace',
                                        fontWeight: 'bold',
                                        wordBreak: 'break-all',
                                        flex: 1,
                                        userSelect: 'all'
                                    }}
                                >
                                    {createdKey}
                                </Typography>
                                <Tooltip title="Copy to clipboard">
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(createdKey);
                                        }}
                                        color={copySuccess ? 'success' : 'default'}
                                    >
                                        <CopyIcon />
                                    </IconButton>
                                </Tooltip>
                            </Paper>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Click the key or the copy button to copy
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {!createdKey ? (
                        <>
                            <Button onClick={() => setOpenApiKey(false)}>Cancel</Button>
                            <Button variant="contained" onClick={handleCreateApiKey} disabled={!newKeyName}>Create</Button>
                        </>
                    ) : (
                        <Button onClick={() => { setOpenApiKey(false); setCreatedKey(null); }}>Done</Button>
                    )}
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Settings;
