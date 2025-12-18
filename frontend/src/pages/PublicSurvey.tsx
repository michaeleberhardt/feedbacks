import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Paper,
    Rating,
    TextField,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import { getPublicSurvey, submitSurvey } from '../services/surveyService';

const PublicSurvey: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [survey, setSurvey] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            getPublicSurvey(id)
                .then(data => setSurvey(data))
                .catch(() => setError('Survey not found or already answered.'))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleRatingChange = (qId: string, value: number | null) => {
        if (value) {
            setAnswers({ ...answers, [qId]: value });
        }
    };

    const handleSubmit = async () => {
        if (!id) return;
        try {
            await submitSurvey(id, { answers, comment });
            setSubmitted(true);
        } catch (err) {
            setError('Failed to submit survey. Please try again.');
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    if (submitted) {
        return (
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Alert severity="success">
                    {survey?.template?.thankYouMessage || 'Thank you! Your feedback has been submitted successfully.'}
                </Alert>
            </Container>
        );
    }

    if (error || !survey) {
        return (
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Alert severity="error">{error || 'Invalid Survey Link'}</Alert>
            </Container>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                bgcolor: 'background.default'
            }}
        >
            <Container maxWidth="sm">
                <Paper sx={{ p: 4, width: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', textAlign: 'center' }}>
                        {survey.template?.logoUrl && (
                            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', width: '100%' }}>
                                <img src={survey.template.logoUrl} alt="Logo" style={{ maxHeight: 80, maxWidth: '100%', display: 'block' }} />
                            </Box>
                        )}

                        <Typography variant="h5" gutterBottom component="h1">
                            {survey.template?.title || 'Feedback Request'}
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 4, whiteSpace: 'pre-wrap' }}>
                            {survey.template?.introText}
                        </Typography>

                        {survey.template?.htmlDesign && (
                            <Box
                                sx={{
                                    mb: 4,
                                    width: '100%',
                                    '& > *': { margin: '0 auto', maxWidth: '100%' },
                                    '& img': { display: 'block', margin: '0 auto', maxWidth: '100%' },
                                    '& p': { textAlign: 'center' },
                                    '& div': { textAlign: 'center' }
                                }}
                                dangerouslySetInnerHTML={{ __html: survey.template.htmlDesign }}
                            />
                        )}

                        <Box component="form" noValidate autoComplete="off" sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {survey.template?.questions.map((q: any) => (
                                <Box key={q.id} sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                    <Typography component="legend" gutterBottom>{q.text}</Typography>
                                    <Rating
                                        name={`question-${q.id}`}
                                        value={answers[q.id] || 0}
                                        onChange={(_, newValue) => handleRatingChange(q.id, newValue)}
                                        size="large"
                                    />
                                </Box>
                            ))}

                            <TextField
                                label={survey.template?.commentLabel || "Additional Comments"}
                                multiline
                                rows={4}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 2, mb: 3 }}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length !== survey.template?.questions.length}
                            >
                                {survey.template?.submitButtonLabel || "Submit Feedback"}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default PublicSurvey;
