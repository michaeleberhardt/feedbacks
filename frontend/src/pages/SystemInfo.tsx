import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Button,
} from '@mui/material';
import { getSystemInfo } from '../services/settings';
import type { SystemInfo as SystemInfoType } from '../services/settings';

const SystemInfo: React.FC = () => {
    const [systemInfo, setSystemInfo] = useState<SystemInfoType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSystemInfo();
    }, []);

    const loadSystemInfo = async () => {
        setLoading(true);
        try {
            const data = await getSystemInfo();
            setSystemInfo(data);
        } catch (error) {
            console.error('Failed to load system info');
        } finally {
            setLoading(false);
        }
    };

    const formatUptime = (seconds: number): string => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    if (loading) {
        return (
            <Box>
                <Typography variant="h4" sx={{ mb: 3 }}>System Info</Typography>
                <Typography color="text.secondary">Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">System Info</Typography>
                <Button variant="outlined" onClick={loadSystemInfo}>Refresh</Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {/* Backend Versions */}
                <Paper sx={{ p: 3, flex: 1, minWidth: 300 }}>
                    <Typography variant="h6" gutterBottom>Backend</Typography>
                    {systemInfo?.backend ? (
                        <Table size="small">
                            <TableBody>
                                <TableRow><TableCell>Node.js</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.backend.node}</TableCell></TableRow>
                                <TableRow><TableCell>Express</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.backend.express}</TableCell></TableRow>
                                <TableRow><TableCell>Prisma</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.backend.prisma}</TableCell></TableRow>
                                <TableRow><TableCell>TypeScript</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.backend.typescript}</TableCell></TableRow>
                                <TableRow><TableCell>Nodemailer</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.backend.nodemailer}</TableCell></TableRow>
                                <TableRow><TableCell>Helmet</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.backend.helmet}</TableCell></TableRow>
                                <TableRow><TableCell>JWT</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.backend.jsonwebtoken}</TableCell></TableRow>
                                <TableRow><TableCell>bcryptjs</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.backend.bcryptjs}</TableCell></TableRow>
                                <TableRow><TableCell>node-cron</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.backend.nodeCron}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography color="text.secondary">Not available</Typography>
                    )}
                </Paper>

                {/* Frontend Versions */}
                <Paper sx={{ p: 3, flex: 1, minWidth: 300 }}>
                    <Typography variant="h6" gutterBottom>Frontend</Typography>
                    {systemInfo?.frontend ? (
                        <Table size="small">
                            <TableBody>
                                <TableRow><TableCell>React</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.frontend.react}</TableCell></TableRow>
                                <TableRow><TableCell>React DOM</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.frontend.reactDom}</TableCell></TableRow>
                                <TableRow><TableCell>Material UI</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.frontend.mui}</TableCell></TableRow>
                                <TableRow><TableCell>React Router</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.frontend.reactRouter}</TableCell></TableRow>
                                <TableRow><TableCell>Axios</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.frontend.axios}</TableCell></TableRow>
                                <TableRow><TableCell>Vite</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.frontend.vite}</TableCell></TableRow>
                                <TableRow><TableCell>TypeScript</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.frontend.typescript}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography color="text.secondary">Not available</Typography>
                    )}
                </Paper>

                {/* System Info */}
                <Paper sx={{ p: 3, flex: 1, minWidth: 300 }}>
                    <Typography variant="h6" gutterBottom>System</Typography>
                    {systemInfo?.system ? (
                        <Table size="small">
                            <TableBody>
                                <TableRow><TableCell>Platform</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.system.platform}</TableCell></TableRow>
                                <TableRow><TableCell>Architecture</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.system.arch}</TableCell></TableRow>
                                <TableRow><TableCell>Uptime</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{formatUptime(systemInfo.system.uptime)}</TableCell></TableRow>
                                <TableRow><TableCell>Memory Usage</TableCell><TableCell sx={{ fontFamily: 'monospace' }}>{systemInfo.system.memoryUsage} MB</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography color="text.secondary">Not available</Typography>
                    )}
                </Paper>
            </Box>
        </Box>
    );
};

export default SystemInfo;
