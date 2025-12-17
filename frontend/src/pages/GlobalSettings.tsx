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
    DialogActions
} from '@mui/material';
import { getSettings, saveSettings } from '../services/settings';
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

const SettingsTest: React.FC = () => {
    const [value, setValue] = useState(0);
    const [smtp, setSmtp] = useState({ host: '', port: '', user: '', pass: '' });
    const [users, setUsers] = useState<User[]>([]);
    const [openUser, setOpenUser] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'USER' });

    useEffect(() => {
        loadSettings();
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users');
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

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Settings</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="settings tabs">
                    <Tab label="System / SMTP" />
                    <Tab label="User Management" />
                </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
                <Paper sx={{ p: 3, maxWidth: 600 }}>
                    <Typography variant="h6" gutterBottom>SMTP Configuration</Typography>
                    <TextField fullWidth label="Host" margin="normal" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} />
                    <TextField fullWidth label="Port" margin="normal" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} />
                    <TextField fullWidth label="User" margin="normal" value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} />
                    <TextField fullWidth label="Password" type="password" margin="normal" value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} />
                    <Button variant="contained" sx={{ mt: 2 }} onClick={handleSave}>Save Settings</Button>
                </Paper>
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" onClick={() => setOpenUser(true)}>Add User</Button>
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

                <Dialog open={openUser} onClose={() => setOpenUser(false)}>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogContent>
                        <TextField
                            margin="dense"
                            label="Email"
                            fullWidth
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        />
                        <TextField
                            margin="dense"
                            label="Password"
                            type="password"
                            fullWidth
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                        <TextField
                            select
                            label="Role"
                            fullWidth
                            margin="dense"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
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
            </CustomTabPanel>
        </Box>
    );
};

export default SettingsTest;
