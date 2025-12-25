
import fetch from 'node-fetch';

const API_URL = 'http://127.0.0.1:5000/api';
const EMAIL = 'admin@haseebautos.com';
const PASSWORD = 'password123';
const TENANT = 'haseebautos';

async function testStores() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant': TENANT
            },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.data.accessToken;
        console.log('Login successful');

        // 2. Get Stores
        console.log('Fetching stores...');
        const storesRes = await fetch(`${API_URL}/stores`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant': TENANT
            }
        });

        if (!storesRes.ok) {
            throw new Error(`Get stores failed: ${storesRes.statusText}`);
        }

        const storesData = await storesRes.json();
        console.log('Stores response structure:', JSON.stringify(storesData, null, 2));

        if (storesData.data && storesData.data.stores && Array.isArray(storesData.data.stores)) {
            console.log('✅ Success: Response contains data.stores array');
        } else {
            console.error('❌ Error: Response does not contain data.stores array');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testStores();
