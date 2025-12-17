import React, { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    FormControlLabel,
    Checkbox,
    Alert,
    CircularProgress
} from '@mui/material';
import { getSettings, saveSettings, sendTestEmail } from '../services/settings';
import type { SystemSettings } from '../services/settings';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<SystemSettings>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings', error);
            setMessage({ text: 'Failed to load settings', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: keyof SystemSettings, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await saveSettings(settings);
            setMessage({ text: 'Settings saved successfully', type: 'success' });
        } catch (error) {
            console.error('Failed to save settings', error);
            setMessage({ text: 'Failed to save settings', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestEmail = async () => {
        if (!testEmail) return;
        setSendingTest(true);
        try {
            await sendTestEmail(testEmail);
            alert('Test email sent successfully!');
        } catch (error) {
            console.error('Failed to send test email', error);
            alert('Failed to send test email. Check server logs.');
        } finally {
            setSendingTest(false);
        }
    };

    if (loading) return <Box sx={{ p: 4 }}><CircularProgress /></Box>;

    return (
        <Box maxWidth="md">
            <Typography variant="h4" gutterBottom>System Settings</Typography>

            {message && (
                <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}

            <Paper sx={{ p: 4, mb: 4 }}>
                <Typography variant="h6" gutterBottom>General Configuration</Typography>
                <Grid container spacing={3}>
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            label="Application URL"
                            placeholder="http://example.com"
                            value={settings.app_url || ''}
                            onChange={(e) => handleChange('app_url', e.target.value)}
                            helperText="Base URL used for generating survey links in emails (e.g. https://feedback.yourcompany.com). Avoid 'localhost' for production."
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 4, mb: 4 }}>
                <Typography variant="h6" gutterBottom>SMTP Email Settings</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                            fullWidth
                            label="SMTP Host"
                            value={settings.host || ''}
                            onChange={(e) => handleChange('host', e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="Port"
                            value={settings.port || ''}
                            onChange={(e) => handleChange('port', e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            label="Username"
                            value={settings.user || ''}
                            onChange={(e) => handleChange('user', e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            type="password"
                            label="Password"
                            value={settings.pass || ''}
                            onChange={(e) => handleChange('pass', e.target.value)}
                        />
                    </Grid>
                    <Grid size={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={settings.secure === 'true'}
                                    onChange={(e) => handleChange('secure', e.target.checked ? 'true' : 'false')}
                                />
                            }
                            label="Use Secure Connection (TLS/SSL)"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={settings.tls_reject !== 'false'} // Default is usually reject (true), so check if NOT 'false'
                                    onChange={(e) => handleChange('tls_reject', e.target.checked ? 'true' : 'false')}
                                />
                            }
                            label="Reject Unauthorized TLS (Strict)"
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" size="large" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </Box>
            </Paper>

            <Paper sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom>Test Email Configuration</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Send a test email to verify your SMTP settings are working correctly.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        label="Recipient Email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />
                    <Button
                        variant="outlined"
                        onClick={handleSendTestEmail}
                        disabled={sendingTest || !testEmail}
                    >
                        {sendingTest ? 'Sending...' : 'Send Test Email'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default Settings;
