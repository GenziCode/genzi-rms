// Test script to verify API connectivity
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  console.log('Testing API connectivity...');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test categories endpoint
    console.log('\n2. Testing categories endpoint...');
    
    // First try without auth (should get 401)
    try {
      const categoriesResponse = await axios.get(`${API_BASE}/categories`);
      console.log('✅ Categories endpoint accessible:', categoriesResponse.data);
    } catch (error) {
      console.log('❌ Categories endpoint error (expected without auth):', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test if server is actually responding
    console.log('\n3. Testing server responsiveness...');
    const startTime = Date.now();
    const response = await axios.get(`${API_BASE}/health`);
    const endTime = Date.now();
    console.log(`✅ Server responded in ${endTime - startTime}ms`);
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();