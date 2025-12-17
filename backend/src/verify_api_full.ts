import axios from 'axios';

const API_URL = 'http://localhost:3001';
let TOKEN = '';
let TEMPLATE_ID = '';
let SURVEY_ID = '';

const api = axios.create({
    baseURL: API_URL,
    validateStatus: () => true // Don't throw on error status
});

const log = (step: string, success: boolean, data?: any) => {
    console.log(`[${success ? 'PASS' : 'FAIL'}] ${step}`);
    if (!success && data) console.error('   Error:', JSON.stringify(data.data || data, null, 2));
};

const verifyApi = async () => {
    console.log('Starting Full API Verification...');

    // 1. Health Check (Root)
    const resRoot = await api.get('/');
    log('Health Check', resRoot.status === 200);

    // 2. Login
    const resLogin = await api.post('/auth/login', {
        email: 'admin@example.com',
        password: 'admin123'
    });
    if (resLogin.status === 200 && resLogin.data.token) {
        TOKEN = resLogin.data.token;
        log('Admin Login', true);
    } else {
        log('Admin Login', false, resLogin);
        return; // specific failure blocking rest
    }

    const authHeader = { headers: { Authorization: `Bearer ${TOKEN}` } };

    // 3. Create Template
    const resTpl = await api.post('/templates', {
        introText: 'API Test Intro',
        htmlDesign: '<div>Test</div>',
        questions: [{ text: 'Do you like APIs?' }]
    }, authHeader);
    if (resTpl.status === 200) {
        TEMPLATE_ID = resTpl.data.id;
        log('Create Template', true);
    } else {
        log('Create Template', false, resTpl);
    }

    // 4. Create Survey
    if (TEMPLATE_ID) {
        const resSurvey = await api.post('/surveys', {
            templateId: TEMPLATE_ID,
            addresseeEmail: 'test@api.com',
            employee: 'API Bot',
            reference: 'REF-API-101'
        }, authHeader);
        if (resSurvey.status === 200) {
            SURVEY_ID = resSurvey.data.id;
            log('Create Survey', true);
        } else {
            log('Create Survey', false, resSurvey);
        }
    }

    // 5. Get Public Survey
    if (SURVEY_ID) {
        const resPublic = await api.get(`/surveys/${SURVEY_ID}/public`);
        log('Get Public Survey (No Auth)', resPublic.status === 200);

        // 6. Submit Survey
        // Need question ID from public response
        const qId = resPublic.data.template.questions[0].id;
        const resSubmit = await api.post(`/surveys/${SURVEY_ID}/submit`, {
            answers: { [qId]: 5 },
            comment: 'Great API!'
        });
        log('Submit Survey (No Auth)', resSubmit.status === 200);
    }

    // 7. Get Survey Results (Admin)
    const resList = await api.get('/surveys?status=all', authHeader);
    log('Get Survey List (Admin)', resList.status === 200 && Array.isArray(resList.data));

    // 8. Settings
    const resSettings = await api.get('/settings', authHeader);
    log('Get Settings', resSettings.status === 200);

    const resSaveSettings = await api.post('/settings', {
        host: 'smtp.test.com',
        port: '587',
        user: 'apikey',
        pass: 'secret'
    }, authHeader);
    log('Save Settings', resSaveSettings.status === 200);

    console.log('API Verification Complete.');
};

verifyApi();
