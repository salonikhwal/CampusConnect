/**
 * test_guidance_e2e.js
 * End-to-end test suite for Seniors & Guidance API
 */
import prisma from './src/config/prisma.js';
import { signToken } from './src/utils/jwt.js';
import { config } from './src/config/env.js';

const BASE_URL = 'http://localhost:5001/api';

async function getAuthCookieForEmail(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`User not found for email ${email}`);
  }
  const token = signToken({ userId: user.id, rollNumber: user.rollNumber });
  return {
    user,
    cookie: `${config.cookieName}=${token}`,
  };
}

async function run() {
  console.log('--- STARTING SENIORS & GUIDANCE E2E TEST ---');

  // 1. Get auth cookies directly to test endpoints without rate-limiter interference
  console.log('\n[1] Preparing authenticated test users...');
  const aarav = await getAuthCookieForEmail('2023ucse042@mnit.ac.in'); // 2nd year
  console.log('✓ 2nd Year loaded: Aarav Sharma (batchYear: 2023)');

  const diya = await getAuthCookieForEmail('2024ucse101@mnit.ac.in'); // 1st year
  console.log('✓ 1st Year loaded: Diya Agarwal (batchYear: 2024)');

  const kartik = await getAuthCookieForEmail('2021ucse019@mnit.ac.in'); // 4th year
  console.log('✓ 4th Year loaded: Kartik Dave (batchYear: 2021)');

  const devendra = await getAuthCookieForEmail('2022ucse034@mnit.ac.in'); // 3rd year
  console.log('✓ 3rd Year loaded: Devendra Singh (batchYear: 2022)');

  // 2. Check Guidance Status for each
  console.log('\n[2] Checking guidance provider eligibility status...');
  const aaravStatusRes = await fetch(`${BASE_URL}/guidance/status`, {
    headers: { Cookie: aarav.cookie },
  });
  const aaravStatus = await aaravStatusRes.json();
  console.log('Aarav eligibility:', aaravStatus.isEligibleSenior, aaravStatus.yearLabel);
  if (aaravStatus.isEligibleSenior !== false) {
    throw new Error('Aarav (2nd year) should NOT be eligible as guidance provider');
  }

  const kartikStatusRes = await fetch(`${BASE_URL}/guidance/status`, {
    headers: { Cookie: kartik.cookie },
  });
  const kartikStatus = await kartikStatusRes.json();
  console.log('Kartik eligibility:', kartikStatus.isEligibleSenior, kartikStatus.yearLabel, 'Opted in:', kartikStatus.isGuidanceProvider);
  if (kartikStatus.isEligibleSenior !== true) {
    throw new Error('Kartik (4th year) MUST be eligible as guidance provider');
  }

  const devendraStatusRes = await fetch(`${BASE_URL}/guidance/status`, {
    headers: { Cookie: devendra.cookie },
  });
  const devendraStatus = await devendraStatusRes.json();
  console.log('Devendra eligibility:', devendraStatus.isEligibleSenior, devendraStatus.yearLabel, 'Opted in:', devendraStatus.isGuidanceProvider);
  if (devendraStatus.isEligibleSenior !== true) {
    throw new Error('Devendra (3rd year) MUST be eligible as guidance provider');
  }

  // 3. Restriction: Juniors (1st and 2nd years) cannot opt in as guidance providers
  console.log('\n[3] Testing junior opt-in restriction (must return 403)...');
  const juniorOptInRes = await fetch(`${BASE_URL}/guidance/opt-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: diya.cookie,
    },
    body: JSON.stringify({
      guidanceTopics: ['C Programming Basics'],
      guidanceBio: 'Freshman wanting to mentor',
    }),
  });
  const juniorOptInData = await juniorOptInRes.json();
  console.log(`Status: ${juniorOptInRes.status}, Message: ${juniorOptInData.message}`);
  if (juniorOptInRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for junior opt-in, got ${juniorOptInRes.status}`);
  }
  console.log('✓ Junior correctly blocked from opting in as guidance provider.');

  // 4. Senior opt-in and update
  console.log('\n[4] 4th-year Senior updating guidance profile...');
  const seniorOptInRes = await fetch(`${BASE_URL}/guidance/opt-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: kartik.cookie,
    },
    body: JSON.stringify({
      guidanceTopics: ['Nachos OS Lab', 'Distributed Systems', 'DBMS Internals', 'Course Electives'],
      guidanceBio: 'Final year senior. Happy to help 2nd years with Nachos thread scheduling and mock viva questions.',
      guidanceAvailability: 'Fridays 4:00 PM – 6:00 PM in Computer Center 3',
    }),
  });
  const seniorOptInData = await seniorOptInRes.json();
  if (seniorOptInRes.status !== 200 || !seniorOptInData.guidanceProfile.isGuidanceProvider) {
    throw new Error(`Senior opt-in failed: ${JSON.stringify(seniorOptInData)}`);
  }
  console.log('✓ Senior guidance profile updated successfully:', seniorOptInData.guidanceProfile.guidanceTopics);

  // 5. Juniors querying guidance providers
  console.log('\n[5] Juniors querying guidance providers list...');
  const providersRes = await fetch(`${BASE_URL}/guidance/providers`, {
    headers: { Cookie: diya.cookie },
  });
  const providersData = await providersRes.json();
  console.log(`✓ Retrieved ${providersData.seniors.length} guidance providers.`);
  if (providersData.seniors.length === 0) {
    throw new Error('Expected active guidance providers in database.');
  }

  // Verify all returned providers are 3rd or 4th years
  for (const s of providersData.seniors) {
    if (!s.yearLabel.includes('3rd Year') && !s.yearLabel.includes('4th Year')) {
      throw new Error(`Non-senior returned in guidance list: ${s.name} (${s.yearLabel})`);
    }
    // Verify no fabricated unverified placement claims
    if (s.bio?.includes('Placed @ Google') || s.about?.includes('Placed @ Google')) {
      throw new Error(`Fabricated placement claim found on senior: ${s.name}`);
    }
  }
  console.log('✓ All providers verified as legitimate 3rd/4th years with clean academic topics.');

  // 6. Filter by topic
  console.log('\n[6] Testing topic filtering...');
  const topicRes = await fetch(`${BASE_URL}/guidance/providers?topic=Nachos`, {
    headers: { Cookie: diya.cookie },
  });
  const topicData = await topicRes.json();
  console.log(`Topic "Nachos" returned ${topicData.seniors.length} seniors.`);
  if (!topicData.seniors.some((s) => s.name === 'Kartik Dave')) {
    throw new Error('Expected Kartik Dave in Nachos topic filter results.');
  }
  console.log('✓ Topic filtering verified.');

  // 7. Search query
  console.log('\n[7] Testing search query...');
  const searchRes = await fetch(`${BASE_URL}/guidance/providers?search=Codeforces`, {
    headers: { Cookie: diya.cookie },
  });
  const searchData = await searchRes.json();
  console.log(`Search "Codeforces" returned ${searchData.seniors.length} seniors.`);
  if (!searchData.seniors.some((s) => s.name === 'Devendra Singh')) {
    throw new Error('Expected Devendra Singh in Codeforces search results.');
  }
  console.log('✓ Search query verified.');

  // 8. Questions students often ask (FAQs)
  console.log('\n[8] Testing Questions students often ask (FAQs)...');
  const faqsRes = await fetch(`${BASE_URL}/guidance/faqs`, {
    headers: { Cookie: diya.cookie },
  });
  const faqsData = await faqsRes.json();
  console.log(`✓ Retrieved ${faqsData.faqs.length} curated guidance FAQs.`);
  if (faqsData.faqs.length === 0) {
    throw new Error('Expected curated guidance FAQs in database.');
  }

  // 9. Topics list
  console.log('\n[9] Testing topics endpoint...');
  const topicsRes = await fetch(`${BASE_URL}/guidance/topics`, {
    headers: { Cookie: diya.cookie },
  });
  const topicsData = await topicsRes.json();
  console.log(`✓ Retrieved ${topicsData.topics.length} topics:`, topicsData.topics.slice(0, 5));

  console.log('\n=============================================');
  console.log('🎉 ALL SENIORS & GUIDANCE TESTS PASSED! 🎉');
  console.log('=============================================');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
