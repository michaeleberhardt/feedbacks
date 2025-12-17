const API_URL = 'http://localhost:3001';

async function main() {
    console.log('Starting E2E Verification...');

    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });

    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('   Login successful. Token acquired.');

    // 2. Create Template
    console.log('2. Creating Template...');
    const templateRes = await fetch(`${API_URL}/templates`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            introText: 'E2E Test Intro',
            logoUrl: 'http://example.com/logo.png',
            htmlDesign: '<div>Test</div>',
            questions: ['Q1?', 'Q2?']
        })
    });
    if (!templateRes.ok) throw new Error(`Create Template failed: ${templateRes.status}`);
    const template = await templateRes.json();
    console.log('   Template created:', template.id);

    // 3. Create Survey
    console.log('3. Creating Survey...');
    const surveyRes = await fetch(`${API_URL}/surveys`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            templateId: template.id,
            reference: 'E2E-REF-001',
            employee: 'Tester',
            addresseeEmail: 'test@example.com'
        })
    });
    if (!surveyRes.ok) throw new Error(`Create Survey failed: ${surveyRes.status}`);
    const survey = await surveyRes.json();
    console.log('   Survey created:', survey.id);

    // 4. Submit Survey (Public)
    console.log('4. Submitting Survey (Public)...');
    // First fetch public details
    const publicRes = await fetch(`${API_URL}/surveys/${survey.id}/public`);
    if (!publicRes.ok) throw new Error(`Get Public Survey failed: ${publicRes.status}`);

    // Submit answers
    // Need question IDs from template
    const q1Id = template.questions[0].id;
    const q2Id = template.questions[1].id;

    const submitRes = await fetch(`${API_URL}/surveys/${survey.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            answers: { [q1Id]: 5, [q2Id]: 4 },
            comment: 'Great service!'
        })
    });
    if (!submitRes.ok) throw new Error(`Submit Survey failed: ${submitRes.status}`);
    console.log('   Survey submitted successfully.');

    // 5. Verify Results (Admin)
    console.log('5. Verifying Results (Admin)...');
    const resultsRes = await fetch(`${API_URL}/surveys?ref=E2E-REF`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resultsRes.ok) throw new Error(`Get Results failed: ${resultsRes.status}`);
    const results = await resultsRes.json();
    const targetSurvey = results.find((s: any) => s.id === survey.id);

    if (targetSurvey && targetSurvey.status === 'answered') {
        console.log('   Verification Successful! Survey found with status answered.');
    } else {
        throw new Error('   Verification Failed: Survey not found or status incorrect.');
    }

    // 6. Verify Settings
    console.log('6. Verifying Settings API...');
    const settingsRes = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ host: 'smtp.test.com', port: '2525' })
    });
    if (!settingsRes.ok) throw new Error(`Update Settings failed: ${settingsRes.status}`);

    const getSettingsRes = await fetch(`${API_URL}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const settings = await getSettingsRes.json();
    if (settings.host === 'smtp.test.com' && settings.port === '2525') {
        console.log('   Settings verification successful.');
    } else {
        throw new Error('   Settings verification failed: Values mismatch.');
    }

    // 7. Verify User Management
    console.log('7. Verifying User Management API...');
    const userRes = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: 'newadmin@example.com', password: 'password123', role: 'ADMIN' })
    });
    if (!userRes.ok) throw new Error(`Create User failed: ${userRes.status}`);

    const getUsersRes = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await getUsersRes.json();
    const newUser = users.find((u: any) => u.email === 'newadmin@example.com');
    if (newUser && newUser.role === 'ADMIN') {
        console.log('   User verification successful.');
    } else {
        throw new Error('   User verification failed: User not found.');
    }
}

main().catch(console.error);
