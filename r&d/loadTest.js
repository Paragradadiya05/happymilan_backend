// loadTest.js
const axios = require('axios');

// 🧠 CONFIGURATION
const API_URL = 'https://stag.mntech.website/api/v1/user/user/getUserByGenderDating';
const JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjaGVja1VzZXJBY3RpdmVQbGFuIjp0cnVlLCJzdWIiOiI2OGQyMzQ4NTg2YjE2MDFjM2YyMDJiNjQiLCJpYXQiOjE3NjE1NDMzMDgsImV4cCI6MTc2MTcyMzMwOH0.edgmWG3qfCTgsg5ydv-ZTnaKBC94ZtIvQ6sBcYMFJh0';

const TOTAL_CALLS = 1000; // how many total times to hit the API
const CONCURRENCY = 1000; // how many requests to run in parallel

// 🧩 Single API Call Function
async function callApi(index) {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    });
    console.log(`✅ ${index} - Status: ${response.status}`);
  } catch (err) {
    if (err.response) {
      console.error(`❌ ${index} - Status: ${err.response.status} - ${err.response.data.message || 'Error'}`);
    } else {
      console.error(`❌ ${index} - Error: ${err.message}`);
    }
  }
}

// 🌀 Batch Controller
async function runLoadTest() {
  const batches = Math.ceil(TOTAL_CALLS / CONCURRENCY);
  console.log(`🚀 Starting ${TOTAL_CALLS} API calls in ${batches} batches...`);

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < batches; i++) {
    const start = i * CONCURRENCY;
    const end = Math.min(start + CONCURRENCY, TOTAL_CALLS);
    const promises = [];

    // eslint-disable-next-line no-plusplus
    for (let j = start; j < end; j++) {
      promises.push(callApi(j + 1));
    }

    // eslint-disable-next-line no-await-in-loop
    await Promise.all(promises); // wait for one batch to finish
    console.log(`✅ Batch ${i + 1}/${batches} completed`);

    // Optional small delay to protect the server
    // eslint-disable-next-line no-await-in-loop
    await new Promise((res) => setTimeout(res, 1000));
  }

  console.log('🎯 All API calls completed successfully');
}

// 🏁 Start test
runLoadTest();
