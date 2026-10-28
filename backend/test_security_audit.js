import http from 'http';

const BASE_URL = 'http://localhost:5001';

// Helper to make HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return cookieStr.split(';')[0];
}

async function runSecurityAudit() {
  console.log('\n===============================================================');
  console.log('       CampusConnect - Automated Security Audit Suite          ');
  console.log('===============================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ PASS - [${totalTests}] ${testName}`);
    } else {
      console.error(`❌ FAIL - [${totalTests}] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  const timestamp = Date.now().toString().slice(-6);

  // -------------------------------------------------------------
  // 1. Password Handling & Domain Validation
  // -------------------------------------------------------------
  console.log('\n--- [1] Password Handling & Authentication Validation ---');

  // Test 1.1: Weak password rejected (< 8 chars)
  const weakPasswordRes = await request('POST', '/api/auth/signup', {
    email: `sec_weak_${timestamp}@mnit.ac.in`,
    password: '123',
    name: 'Weak Pass Test',
    rollNumber: `2024SECW${timestamp.slice(-3)}`,
  });
  assert(
    weakPasswordRes.status === 400,
    'Signup rejects short/weak password (< 8 chars)',
    JSON.stringify(weakPasswordRes.data)
  );

  // Test 1.2: Invalid email domain rejected
  const invalidDomainRes = await request('POST', '/api/auth/signup', {
    email: `attacker_${timestamp}@gmail.com`,
    password: 'Password123!',
    name: 'Attacker Test',
    rollNumber: `2024ATK${timestamp.slice(-3)}`,
  });
  assert(
    invalidDomainRes.status === 400,
    'Signup strictly requires @mnit.ac.in domain',
    JSON.stringify(invalidDomainRes.data)
  );

  // Create User A (Student A)
  const userARes = await request('POST', '/api/auth/signup', {
    email: `user_a_${timestamp}@mnit.ac.in`,
    password: 'SecurePassword123!',
    name: 'Alice Sharma',
    rollNumber: `2024ALC${timestamp.slice(-3)}`,
    batchYear: 2024,
    hostel: 'Gargi Hostel',
    roomNo: 'G-102',
    department: 'Computer Science & Engineering',
  });
  assert(
    userARes.status === 201 && userARes.data?.user?.id,
    'User A successfully registered',
    JSON.stringify(userARes.data)
  );
  const cookieA = extractCookie(userARes.headers);
  const userA = userARes.data.user;

  // Test 1.3: User A response does NOT contain password hash
  assert(
    userA.password === undefined,
    'User registration response omits password hash'
  );

  // Create User B (Student B)
  const userBRes = await request('POST', '/api/auth/signup', {
    email: `user_b_${timestamp}@mnit.ac.in`,
    password: 'SecurePassword123!',
    name: 'Bob Verma',
    rollNumber: `2024BOB${timestamp.slice(-3)}`,
    batchYear: 2024,
    hostel: 'Hostel 4',
    roomNo: 'H4-204',
    department: 'Computer Science & Engineering',
  });
  assert(
    userBRes.status === 201 && userBRes.data?.user?.id,
    'User B successfully registered'
  );
  const cookieB = extractCookie(userBRes.headers);
  const userB = userBRes.data.user;

  // -------------------------------------------------------------
  // 2. Cookie & JWT Settings
  // -------------------------------------------------------------
  console.log('\n--- [2] Cookie / JWT Settings & Security Headers ---');

  const rawSetCookie = Array.isArray(userARes.headers['set-cookie'])
    ? userARes.headers['set-cookie'][0]
    : userARes.headers['set-cookie'] || '';

  assert(
    rawSetCookie.toLowerCase().includes('httponly'),
    'JWT cookie is flagged HttpOnly to mitigate cookie-theft XSS',
    rawSetCookie
  );

  assert(
    rawSetCookie.toLowerCase().includes('path=/'),
    'JWT cookie is scoped to Path=/',
    rawSetCookie
  );

  // Test OWASP Security Headers
  assert(
    userARes.headers['x-content-type-options'] === 'nosniff',
    'X-Content-Type-Options: nosniff header is present'
  );
  assert(
    userARes.headers['x-frame-options'] === 'DENY',
    'X-Frame-Options: DENY header is present (anti-clickjacking)'
  );

  // Test tampered JWT rejected
  const tamperedTokenRes = await request('GET', '/api/auth/me', null, {
    Cookie: 'campusconnect_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
  });
  assert(
    tamperedTokenRes.status === 401,
    'Tampered or forged JWT is rejected with 401 Unauthorized',
    JSON.stringify(tamperedTokenRes.data)
  );

  // -------------------------------------------------------------
  // 3. Authorization & Privilege Escalation Checks
  // -------------------------------------------------------------
  console.log('\n--- [3] Authorization & Cross-Account Isolation ---');

  // Test 3.1: User A cannot edit User B's profile
  const editOtherProfileRes = await request(
    'PUT',
    `/api/users/${userB.id}`,
    { name: 'Hacked Name' },
    { Cookie: cookieA }
  );
  assert(
    editOtherProfileRes.status === 403,
    "User A cannot edit User B's profile (403 Forbidden)",
    JSON.stringify(editOtherProfileRes.data)
  );

  // Test 3.2: User A creates a post
  const postRes = await request(
    'POST',
    '/api/posts',
    {
      title: "Alice's Post",
      content: 'This is a secure post by Alice.',
      category: 'Questions',
      isPinned: true, // Non-admin attempts privilege escalation to pin
    },
    { Cookie: cookieA }
  );
  assert(
    postRes.status === 201,
    'User A creates a community post',
    JSON.stringify(postRes.data)
  );
  const postId = postRes.data.post.id;

  // Test 3.3: Privilege Escalation Prevention - Student cannot pin post
  assert(
    postRes.data.post.isPinned === false,
    'Privilege Escalation Blocked: Regular student cannot force isPinned=true'
  );

  // Test 3.4: User B cannot edit User A's post
  const editPostRes = await request(
    'PUT',
    `/api/posts/${postId}`,
    { content: 'Hacked content by Bob' },
    { Cookie: cookieB }
  );
  assert(
    editPostRes.status === 403,
    "User B cannot edit User A's post (403 Forbidden)",
    JSON.stringify(editPostRes.data)
  );

  // Test 3.5: User B cannot delete User A's post
  const deletePostRes = await request('DELETE', `/api/posts/${postId}`, null, {
    Cookie: cookieB,
  });
  assert(
    deletePostRes.status === 403,
    "User B cannot delete User A's post (403 Forbidden)",
    JSON.stringify(deletePostRes.data)
  );

  // Test 3.6: User A creates a group
  const groupRes = await request(
    'POST',
    '/api/groups',
    {
      name: "Alice's Private Study Circle",
      description: 'Strictly members only group',
      category: 'academic',
    },
    { Cookie: cookieA }
  );
  assert(groupRes.status === 201, 'User A creates a private group');
  const groupId = groupRes.data.group.id;

  // Test 3.7: User B cannot read group workspace or messages without invitation & acceptance
  const getGroupRes = await request('GET', `/api/groups/${groupId}`, null, {
    Cookie: cookieB,
  });
  assert(
    getGroupRes.status === 403,
    "Non-member User B cannot view User A's group workspace (403 Forbidden)",
    JSON.stringify(getGroupRes.data)
  );

  const getGroupMsgsRes = await request('GET', `/api/groups/${groupId}/messages`, null, {
    Cookie: cookieB,
  });
  assert(
    getGroupMsgsRes.status === 403,
    'Non-member User B cannot read group messages (403 Forbidden)',
    JSON.stringify(getGroupMsgsRes.data)
  );

  // Test 3.8: User B cannot edit group details or invite members
  const updateGroupRes = await request(
    'PUT',
    `/api/groups/${groupId}`,
    { name: 'Compromised Group Name' },
    { Cookie: cookieB }
  );
  assert(
    updateGroupRes.status === 403,
    "Non-creator User B cannot edit User A's group details (403 Forbidden)",
    JSON.stringify(updateGroupRes.data)
  );

  // -------------------------------------------------------------
  // 4. Direct Message Isolation
  // -------------------------------------------------------------
  console.log('\n--- [4] Direct Message Privacy & Authorization ---');

  // Create User C (Eavesdropper)
  const userCRes = await request('POST', '/api/auth/signup', {
    email: `user_c_${timestamp}@mnit.ac.in`,
    password: 'SecurePassword123!',
    name: 'Charlie Spy',
    rollNumber: `2024SPY${timestamp.slice(-3)}`,
    batchYear: 2024,
  });
  const cookieC = extractCookie(userCRes.headers);

  // Alice says Hi to Bob
  const sayHiRes = await request(
    'POST',
    '/api/messages/say-hi',
    {
      recipientId: userB.id,
      note: 'Hey Bob, want to study algorithms together?',
    },
    { Cookie: cookieA }
  );
  assert(
    sayHiRes.status === 201 || sayHiRes.status === 200,
    'Alice sends Say Hi message to Bob',
    JSON.stringify(sayHiRes.data)
  );
  const conversationId = sayHiRes.data.conversation.id;

  // Test 4.1: User C cannot read Alice and Bob's private conversation
  const spyReadRes = await request(
    'GET',
    `/api/messages/conversations/${conversationId}`,
    null,
    { Cookie: cookieC }
  );
  assert(
    spyReadRes.status === 403,
    "Unauthorized User C cannot read Alice and Bob's private messages (403 Forbidden)",
    JSON.stringify(spyReadRes.data)
  );

  // Test 4.2: User C cannot send messages into Alice and Bob's private conversation
  const spySendRes = await request(
    'POST',
    `/api/messages/conversations/${conversationId}/messages`,
    { content: 'Eavesdropper injection attempt' },
    { Cookie: cookieC }
  );
  assert(
    spySendRes.status === 403,
    "Unauthorized User C cannot post to Alice and Bob's conversation (403 Forbidden)",
    JSON.stringify(spySendRes.data)
  );

  // -------------------------------------------------------------
  // 5. Input Validation & XSS Attack Resistance
  // -------------------------------------------------------------
  console.log('\n--- [5] Input Validation & XSS Prevention ---');

  // Test 5.1: XSS attempt via javascript: URI scheme in profile links
  const xssProfileRes = await request(
    'PUT',
    '/api/users/profile',
    {
      githubUrl: 'javascript:alert(document.cookie)',
    },
    { Cookie: cookieA }
  );
  assert(
    xssProfileRes.status === 400,
    'Backend Zod schema rejects javascript: protocol URL in profile (XSS blocked)',
    JSON.stringify(xssProfileRes.data)
  );

  // Test 5.2: XSS attempt via data: URI scheme in opportunities link
  const xssOppRes = await request(
    'POST',
    '/api/updates',
    {
      title: 'Malicious Event',
      description: 'Click for free t-shirts',
      category: 'Events',
      linkUrl: 'data:text/html,<script>alert(1)</script>',
    },
    { Cookie: cookieA }
  );
  assert(
    xssOppRes.status === 400,
    'Backend Zod schema rejects data: protocol URL in updates (XSS blocked)',
    JSON.stringify(xssOppRes.data)
  );

  // Test 5.3: Student cannot post official circular (Admin-only check)
  const fakeOfficialRes = await request(
    'POST',
    '/api/updates',
    {
      title: 'Fake Exam Postponement',
      description: 'All end-terms cancelled',
      category: 'Academic Updates',
      isOfficial: true,
    },
    { Cookie: cookieA }
  );
  assert(
    fakeOfficialRes.status === 403,
    'Student cannot mark circulars as isOfficial=true (403 Forbidden)',
    JSON.stringify(fakeOfficialRes.data)
  );

  // -------------------------------------------------------------
  // 6. Private Data Leaking Checks
  // -------------------------------------------------------------
  console.log('\n--- [6] Data Privacy & Sensitive Field Masking ---');

  // Alice sets her privacy settings to HIDE contact details
  await request(
    'PUT',
    '/api/users/profile',
    {
      phone: '+91 98765 43210',
      privacySettings: {
        showContactDetails: false, // Explicitly private
        showRoomNumber: false,     // Explicitly private
      },
    },
    { Cookie: cookieA }
  );

  // Bob views Alice's profile
  const bobViewsAliceRes = await request('GET', `/api/users/${userA.id}`, null, {
    Cookie: cookieB,
  });
  assert(bobViewsAliceRes.status === 200, "Bob views Alice's profile");
  const aliceProfileSeenByBob = bobViewsAliceRes.data.profile;

  assert(
    aliceProfileSeenByBob.email === null && aliceProfileSeenByBob.phone === null,
    "Alice's email and phone are masked (null) when privacy setting showContactDetails=false"
  );
  assert(
    aliceProfileSeenByBob.roomNo === null,
    "Alice's room number is masked (null) when privacy setting showRoomNumber=false"
  );
  assert(
    aliceProfileSeenByBob.password === undefined,
    'Profile endpoint never leaks password hash'
  );

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('                 SECURITY AUDIT SUMMARY                       ');
  console.log('===============================================================');
  console.log(`Total Security Checks: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL SECURITY AUDIT TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  } else {
    console.error('\n⚠️ SOME SECURITY CHECKS FAILED!\n');
    process.exit(1);
  }
}

runSecurityAudit().catch((err) => {
  console.error('Security audit runtime error:', err);
  process.exit(1);
});
