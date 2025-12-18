import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Paper,
    Typography,
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
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Container,
    Rating,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { getTemplates, createTemplate, deleteTemplate, updateTemplate } from '../services/templates';
import { uploadFile, createSurvey } from '../services/surveyService';
import type { Template } from '../services/templates';

const STANDARD_DESIGN_HTML = `
<style>
  body { background-color: #f8fafc; }
  .MuiPaper-root { 
    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1) !important; 
    border-radius: 16px !important; 
    padding: 40px !important;
  }
  .MuiTypography-h5 { font-weight: 800 !important; color: #0f172a; margin-bottom: 8px !important; }
  .MuiTypography-body1 { color: #64748b; }
  .MuiButton-contained { 
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
    text-transform: none !important;
    font-weight: 600 !important;
    padding: 12px !important;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2) !important;
  }
</style>
<div style="text-align: center; margin: 0 0 30px 0;">
  <div style="width: 60px; height: 4px; background: #e2e8f0; margin: 0 auto; border-radius: 2px;"></div>
</div>
`;

const Templates: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [open, setOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [triggerOpen, setTriggerOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [triggerData, setTriggerData] = useState({
        reference: '',
        employee: '',
        addresseeEmail: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newTemplate, setNewTemplate] = useState<{
        title: string;
        internalName: string;
        introText: string;
        logoUrl: string;
        htmlDesign: string;
        emailSubject: string;
        emailBody: string;
        commentLabel: string;
        submitButtonLabel: string;
        thankYouMessage: string;
        questions: string[];
    }>({
        title: 'Feedback Request',
        internalName: '',
        introText: '',
        logoUrl: '',
        htmlDesign: '<div></div>',
        emailSubject: 'Feedback Request: {reference}',
        emailBody: '<div><p>Please provide your feedback.</p><p><a href="{link}">Click here</a></p></div>',
        commentLabel: 'Additional Comments',
        submitButtonLabel: 'Submit Feedback',
        thankYouMessage: 'Thank you! Your feedback has been submitted successfully.',
        questions: []
    });
    const [newQuestion, setNewQuestion] = useState('');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates', error);
        }
    };

    const handleSave = async () => {
        console.log('handleSave called with:', newTemplate);
        try {
            if (editingId) {
                console.log('Updating template', editingId);
                await updateTemplate(editingId, newTemplate);
            } else {
                console.log('Creating new template');
                await createTemplate(newTemplate);
            }
            console.log('Save successful');
            setOpen(false);
            setEditingId(null);
            setNewTemplate({
                title: 'Feedback Request',
                internalName: '',
                introText: '',
                logoUrl: '',
                htmlDesign: '<div></div>',
                emailSubject: 'Feedback Request: {reference}',
                emailBody: '<div><p>Please provide your feedback.</p><p><a href="{link}">Click here</a></p></div>',
                commentLabel: 'Additional Comments',
                submitButtonLabel: 'Submit Feedback',
                thankYouMessage: 'Thank you! Your feedback has been submitted successfully.',
                questions: []
            });
            loadTemplates();
        } catch (error: any) {
            console.error('Failed to save template', error);
            alert(error.response?.data?.message || 'Failed to save template');
        }
    };

    const handleEdit = (template: Template) => {
        setNewTemplate({
            title: template.title,
            internalName: template.internalName || '',
            introText: template.introText,
            logoUrl: template.logoUrl,
            htmlDesign: template.htmlDesign,
            emailSubject: template.emailSubject || 'Feedback Request: {reference}',
            emailBody: template.emailBody || '<div><p>Please provide your feedback.</p><p><a href="{link}">Click here</a></p></div>',
            commentLabel: template.commentLabel || 'Additional Comments',
            submitButtonLabel: template.submitButtonLabel || 'Submit Feedback',
            thankYouMessage: template.thankYouMessage || 'Thank you! Your feedback has been submitted successfully.',
            questions: template.questions.map(q => q.text)
        });
        setEditingId(template.id);
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure?')) {
            try {
                await deleteTemplate(id);
                loadTemplates();
            } catch (error) {
                console.error('Failed to delete template', error);
            }
        }
    };

    const addQuestion = () => {
        if (newQuestion) {
            setNewTemplate({ ...newTemplate, questions: [...newTemplate.questions, newQuestion] });
            setNewQuestion('');
        }
    };

    const removeQuestion = (index: number) => {
        const updated = [...newTemplate.questions];
        updated.splice(index, 1);
        setNewTemplate({ ...newTemplate, questions: updated });
    }

    const handleTriggerClick = (templateId: string) => {
        setSelectedTemplateId(templateId);
        setTriggerData({ reference: '', employee: '', addresseeEmail: '' });
        setTriggerOpen(true);
    };

    const handleTriggerSubmit = async () => {
        if (!selectedTemplateId) return;
        try {
            await createSurvey({
                templateId: selectedTemplateId,
                ...triggerData
            });
            alert('Survey triggered successfully!');
            setTriggerOpen(false);
        } catch (error: any) {
            console.error('Failed to trigger survey', error);
            alert(error.response?.data?.message || 'Failed to trigger survey');
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Templates</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                    setEditingId(null);
                    setNewTemplate({
                        title: 'Feedback Request',
                        internalName: '',
                        introText: '',
                        logoUrl: '',
                        htmlDesign: '<div></div>',
                        emailSubject: 'Feedback Request: {reference}',
                        emailBody: '<div><p>Please provide your feedback.</p><p><a href="{link}">Click here</a></p></div>',
                        commentLabel: 'Additional Comments',
                        submitButtonLabel: 'Submit Feedback',
                        thankYouMessage: 'Thank you! Your feedback has been submitted successfully.',
                        questions: []
                    });
                    setOpen(true);
                }}>New Template</Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Internal Name</TableCell>
                            <TableCell>Introduction</TableCell>
                            <TableCell>Questions</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {templates.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>{row.title}</TableCell>
                                <TableCell>{row.internalName || '-'}</TableCell>
                                <TableCell>{row.introText}</TableCell>
                                <TableCell>{row.questions.length}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => handleTriggerClick(row.id)}><PlayArrowIcon /></IconButton>
                                    <IconButton onClick={() => handleEdit(row)}><EditIcon /></IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => {
                setOpen(false);
                setEditingId(null);
                setNewTemplate({
                    title: 'Feedback Request',
                    internalName: '',
                    introText: '',
                    logoUrl: '',
                    htmlDesign: '<div></div>',
                    emailSubject: 'Feedback Request: {reference}',
                    emailBody: '<div><p>Please provide your feedback.</p><p><a href="{link}">Click here</a></p></div>',
                    commentLabel: 'Additional Comments',
                    submitButtonLabel: 'Submit Feedback',
                    thankYouMessage: 'Thank you! Your feedback has been submitted successfully.',
                    questions: []
                });
            }} maxWidth="md" fullWidth>
                <DialogTitle>{editingId ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Title"
                        fullWidth
                        value={newTemplate.title}
                        onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                        helperText="The header text displayed above the survey (e.g. 'Feedback Request')"
                    />
                    <TextField
                        margin="dense"
                        label="Internal Name"
                        fullWidth
                        value={newTemplate.internalName}
                        onChange={(e) => setNewTemplate({ ...newTemplate, internalName: e.target.value })}
                        helperText="Only visible internally"
                    />
                    <TextField
                        margin="dense"
                        label="Introduction Text"
                        fullWidth
                        multiline
                        rows={2}
                        value={newTemplate.introText}
                        onChange={(e) => setNewTemplate({ ...newTemplate, introText: e.target.value })}
                    />

                    <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Email Configuration</Typography>
                        <TextField
                            margin="dense"
                            label="Email Subject"
                            fullWidth
                            value={newTemplate.emailSubject}
                            onChange={(e) => setNewTemplate({ ...newTemplate, emailSubject: e.target.value })}
                            helperText="Supports {reference}"
                        />
                        <TextField
                            margin="dense"
                            label="Email Body (HTML)"
                            fullWidth
                            multiline
                            rows={3}
                            value={newTemplate.emailBody}
                            onChange={(e) => setNewTemplate({ ...newTemplate, emailBody: e.target.value })}
                            helperText="Supports {reference} and {link} placeholders."
                            InputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }}
                        />
                    </Box>

                    <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Logo</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {newTemplate.logoUrl && (
                                <Box component="img" src={newTemplate.logoUrl} sx={{ height: 40, border: '1px solid #ddd', borderRadius: 1, p: 0.5 }} />
                            )}
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="logo-upload"
                                type="file"
                                onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        try {
                                            const url = await uploadFile(e.target.files[0]);
                                            setNewTemplate({ ...newTemplate, logoUrl: url });
                                        } catch (error) {
                                            console.error('Upload failed', error);
                                            alert('Failed to upload logo');
                                        }
                                    }
                                }}
                            />
                            <label htmlFor="logo-upload">
                                <Button variant="outlined" component="span" size="small">
                                    Upload Logo
                                </Button>
                            </label>
                            {newTemplate.logoUrl && (
                                <Button size="small" color="error" onClick={() => setNewTemplate({ ...newTemplate, logoUrl: '' })}>Remove</Button>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">HTML Design</Typography>
                            <Button
                                size="small"
                                onClick={() => setNewTemplate({ ...newTemplate, htmlDesign: STANDARD_DESIGN_HTML })}
                            >
                                Load Standard
                            </Button>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={newTemplate.htmlDesign}
                            onChange={(e) => setNewTemplate({ ...newTemplate, htmlDesign: e.target.value })}
                            helperText="Enter HTML or CSS (<style>) to customize the survey."
                            InputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }}
                        />
                    </Box>

                    <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Labels & Messages</Typography>
                        <TextField
                            margin="dense"
                            label="Comment Field Label"
                            fullWidth
                            value={newTemplate.commentLabel}
                            onChange={(e) => setNewTemplate({ ...newTemplate, commentLabel: e.target.value })}
                        />
                        <TextField
                            margin="dense"
                            label="Submit Button Label"
                            fullWidth
                            value={newTemplate.submitButtonLabel}
                            onChange={(e) => setNewTemplate({ ...newTemplate, submitButtonLabel: e.target.value })}
                        />
                        <TextField
                            margin="dense"
                            label="Thank You Message"
                            fullWidth
                            multiline
                            rows={2}
                            value={newTemplate.thankYouMessage}
                            onChange={(e) => setNewTemplate({ ...newTemplate, thankYouMessage: e.target.value })}
                            helperText="Displayed after survey submission"
                        />
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1">Questions</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Enter question..."
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                            />
                            <Button variant="outlined" onClick={addQuestion}>Add</Button>
                        </Box>
                        <List dense>
                            {newTemplate.questions.map((q, i) => (
                                <ListItem key={i}>
                                    <ListItemText primary={q} />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" size="small" onClick={() => removeQuestion(i)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(true)} color="info">Preview</Button>
                    <Box sx={{ flex: '1 1 auto' }} />
                    <Button onClick={() => setPreviewOpen(true)} color="info">Preview</Button>
                    <Box sx={{ flex: '1 1 auto' }} />
                    <Button onClick={() => {
                        setOpen(false);
                        setEditingId(null);
                        setNewTemplate({
                            title: 'Feedback Request',
                            internalName: '',
                            introText: '',
                            logoUrl: '',
                            htmlDesign: '<div></div>',
                            emailSubject: 'Feedback Request: {reference}',
                            emailBody: '<div><p>Please provide your feedback.</p><p><a href="{link}">Click here</a></p></div>',
                            commentLabel: 'Additional Comments',
                            submitButtonLabel: 'Submit Feedback',
                            thankYouMessage: 'Thank you! Your feedback has been submitted successfully.',
                            questions: []
                        });
                    }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullScreen>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Preview
                        <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ bgcolor: '#f5f5f5' }}>
                    <Container maxWidth="md" sx={{ py: 4 }}>
                        <Paper sx={{ p: 4 }}>
                            {newTemplate.logoUrl && (
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <img src={newTemplate.logoUrl} alt="Logo" style={{ maxHeight: 80 }} />
                                </Box>
                            )}

                            <Typography variant="h5" gutterBottom align="center">
                                {newTemplate.title ? `${newTemplate.title}: Reference #12345` : 'Feedback Request: Reference #12345'}
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4, whiteSpace: 'pre-wrap' }}>
                                {newTemplate.introText || 'Introduction text will appear here...'}
                            </Typography>

                            {newTemplate.htmlDesign && (
                                <Box sx={{ mb: 4 }} dangerouslySetInnerHTML={{ __html: newTemplate.htmlDesign }} />
                            )}

                            <Box component="form" noValidate autoComplete="off">
                                {newTemplate.questions.length === 0 && (
                                    <Typography variant="body2" color="text.secondary" align="center">No questions added yet.</Typography>
                                )}
                                {newTemplate.questions.map((q, i) => (
                                    <Box key={i} sx={{ mb: 3 }}>
                                        <Typography component="legend">{q}</Typography>
                                        <Rating name={`preview-q-${i}`} size="large" />
                                    </Box>
                                ))}

                                <TextField
                                    label={newTemplate.commentLabel || "Additional Comments"}
                                    multiline
                                    rows={4}
                                    fullWidth
                                    variant="outlined"
                                    sx={{ mt: 2, mb: 3 }}
                                    disabled
                                    placeholder="Comments would go here..."
                                />

                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled
                                >
                                    {newTemplate.submitButtonLabel || "Submit Feedback"}
                                </Button>
                            </Box>
                        </Paper>
                    </Container>
                </DialogContent>
            </Dialog>

            <Dialog open={triggerOpen} onClose={() => setTriggerOpen(false)}>
                <DialogTitle>Trigger Survey</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Reference (e.g. Order ID)"
                        fullWidth
                        value={triggerData.reference}
                        onChange={(e) => setTriggerData({ ...triggerData, reference: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Employee Name"
                        fullWidth
                        value={triggerData.employee}
                        onChange={(e) => setTriggerData({ ...triggerData, employee: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Addressee Email"
                        type="email"
                        fullWidth
                        value={triggerData.addresseeEmail}
                        onChange={(e) => setTriggerData({ ...triggerData, addresseeEmail: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTriggerOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleTriggerSubmit}>Start Survey</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Templates;
