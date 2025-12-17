import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { format } from 'date-fns';
import { getEmailLogs, type EmailLog } from '../services/logs';

const EmailLogs: React.FC = () => {
    const [logs, setLogs] = useState<EmailLog[]>([]);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            const data = await getEmailLogs();
            setLogs(data);
        } catch (error) {
            console.error('Failed to load logs', error);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Email Logs</Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Recipient</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Error Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>{format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss')}</TableCell>
                                <TableCell>{log.recipient}</TableCell>
                                <TableCell>{log.subject}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={log.status}
                                        color={log.status === 'SUCCESS' ? 'success' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{log.errorDetails || '-'}</TableCell>
                            </TableRow>
                        ))}
                        {logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No logs found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default EmailLogs;
