const BASE_URL = 'http://localhost:5001/api';

class ApiClient {
  constructor() {
    this.cookie = null;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.cookie ? { Cookie: this.cookie } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      this.cookie = setCookie.split(';')[0];
    }

    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

async function runTest() {
  console.log('🧪 Starting Groups & Workspace E2E Backend Verification...\n');

  // Check backend server availability
  try {
    const healthCheck = await fetch(`${BASE_URL}/health`);
    if (!healthCheck.ok) throw new Error('Backend not healthy');
  } catch (err) {
    console.error('⚠️ Backend server not reachable at http://localhost:5001. Please ensure backend dev server is running.');
    process.exit(1);
  }

  // Step 1: Login Aarav (Creator), Diya (Invitee), Sneha (Non-member / invitee)
  console.log('1️⃣ Logging in test users...');
  
  const aaravClient = new ApiClient();
  const diyaClient = new ApiClient();
  const snehaClient = new ApiClient();

  const aaravLogin = await aaravClient.post('/auth/login', {
    email: '2023ucse042@mnit.ac.in',
    password: 'StrongPassword123',
  });
  if (!aaravLogin.ok) throw new Error(`Aarav login failed: ${JSON.stringify(aaravLogin.data)}`);
  const aaravUser = aaravLogin.data.user;
  console.log(`✅ Logged in Aarav: ${aaravUser.name} (${aaravUser.id})`);

  const diyaLogin = await diyaClient.post('/auth/login', {
    email: '2024ucse101@mnit.ac.in',
    password: 'StrongPassword123',
  });
  if (!diyaLogin.ok) throw new Error(`Diya login failed: ${JSON.stringify(diyaLogin.data)}`);
  const diyaUser = diyaLogin.data.user;
  console.log(`✅ Logged in Diya: ${diyaUser.name} (${diyaUser.id})`);

  const snehaLogin = await snehaClient.post('/auth/login', {
    email: '2023ucse088@mnit.ac.in',
    password: 'StrongPassword123',
  });
  if (!snehaLogin.ok) throw new Error(`Sneha login failed: ${JSON.stringify(snehaLogin.data)}`);
  const snehaUser = snehaLogin.data.user;
  console.log(`✅ Logged in Sneha: ${snehaUser.name} (${snehaUser.id})\n`);

  // Step 2: Aarav creates group
  console.log('2️⃣ Aarav creates a new group: "Sphinx AI Track Sprint"...');
  const createRes = await aaravClient.post('/groups', {
    name: 'Sphinx AI Track Sprint',
    description: 'Autonomous multi-agent systems for Rajasthan hackathon track.',
    category: 'hackathon',
    avatarUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150',
  });
  if (!createRes.ok) throw new Error(`Create group failed: ${JSON.stringify(createRes.data)}`);
  console.log(`✅ Group created: "${createRes.data.group.name}" (ID: ${createRes.data.group.id})`);
  const groupId = createRes.data.group.id;

  // Step 3: Search students to invite
  console.log('\n3️⃣ Aarav searches invite candidates for "Diya"...');
  const searchRes = await aaravClient.get(`/groups/${groupId}/invite-candidates?q=Diya`);
  if (!searchRes.ok) throw new Error(`Search failed: ${JSON.stringify(searchRes.data)}`);
  const foundCandidate = searchRes.data.candidates.find((c) => c.id === diyaUser.id);
  if (!foundCandidate) throw new Error('Diya not found in invite candidates');
  console.log(`✅ Found candidate: ${foundCandidate.name} (${foundCandidate.rollNumber})`);

  // Step 4: Aarav sends invitation to Diya
  console.log('\n4️⃣ Aarav sends invitation to Diya...');
  const inviteRes = await aaravClient.post(`/groups/${groupId}/invitations`, {
    userId: diyaUser.id,
  });
  if (!inviteRes.ok) throw new Error(`Invite failed: ${JSON.stringify(inviteRes.data)}`);
  console.log(`✅ ${inviteRes.data.message}`);

  // Step 5: Check that Diya cannot read or post while invitation is pending
  console.log('\n5️⃣ Verify Diya (pending invitee) CANNOT read or post messages...');
  const unacceptedRead = await diyaClient.get(`/groups/${groupId}/messages`);
  if (unacceptedRead.status === 403) {
    console.log('✅ Correctly blocked unaccepted member from reading messages (403 Forbidden)');
  } else {
    throw new Error(`Expected 403 Forbidden, got: ${unacceptedRead.status}`);
  }

  const unacceptedPost = await diyaClient.post(`/groups/${groupId}/messages`, { content: 'Sneaking a message early' });
  if (unacceptedPost.status === 403) {
    console.log('✅ Correctly blocked unaccepted member from posting messages (403 Forbidden)');
  } else {
    throw new Error(`Expected 403 Forbidden, got: ${unacceptedPost.status}`);
  }

  // Step 6: Diya views pending invitations
  console.log('\n6️⃣ Diya checks pending invitations...');
  const invitesListRes = await diyaClient.get('/groups/invitations');
  if (!invitesListRes.ok) throw new Error(`Fetch invites failed: ${JSON.stringify(invitesListRes.data)}`);
  const pendingInv = invitesListRes.data.invitations.find((i) => i.groupId === groupId);
  if (!pendingInv) throw new Error('Invitation not found in Diya pending invitations list');
  console.log(`✅ Diya received invitation for: "${pendingInv.groupName}" from ${pendingInv.invitedBy?.name}`);

  // Step 7: Diya accepts invitation
  console.log('\n7️⃣ Diya accepts invitation...');
  const acceptRes = await diyaClient.post(`/groups/${groupId}/invitations/accept`);
  if (!acceptRes.ok) throw new Error(`Accept invite failed: ${JSON.stringify(acceptRes.data)}`);
  console.log(`✅ ${acceptRes.data.message}`);

  // Step 8: Diya posts a message and reads chat
  console.log('\n8️⃣ Diya posts a group message now that she is accepted...');
  const msgRes = await diyaClient.post(`/groups/${groupId}/messages`, {
    content: 'Hey Aarav! Excited to collaborate on the Sphinx AI track!',
  });
  if (!msgRes.ok) throw new Error(`Post message failed: ${JSON.stringify(msgRes.data)}`);
  console.log(`✅ Diya sent message: "${msgRes.data.message.content}"`);

  const readRes = await diyaClient.get(`/groups/${groupId}/messages`);
  if (!readRes.ok) throw new Error(`Read messages failed: ${JSON.stringify(readRes.data)}`);
  console.log(`✅ Diya read messages (Total: ${readRes.data.messages.length})`);

  // Step 9: Creator permissions test: Sneha tries to edit group or remove Diya
  console.log('\n9️⃣ Verify Sneha (non-creator) cannot edit group details or remove members...');
  const unauthorizedEdit = await snehaClient.put(`/groups/${groupId}`, { name: 'Hacked Group Name' });
  if (unauthorizedEdit.status === 403) {
    console.log('✅ Correctly blocked non-creator from editing group (403 Forbidden)');
  } else {
    throw new Error(`Expected 403 Forbidden for non-creator edit, got: ${unauthorizedEdit.status}`);
  }

  const unauthorizedRemove = await snehaClient.delete(`/groups/${groupId}/members/${diyaUser.id}`);
  if (unauthorizedRemove.status === 403) {
    console.log('✅ Correctly blocked non-creator from removing members (403 Forbidden)');
  } else {
    throw new Error(`Expected 403 Forbidden for non-creator remove member, got: ${unauthorizedRemove.status}`);
  }

  // Step 10: Aarav (creator) edits group details
  console.log('\n🔟 Aarav (creator) updates group description...');
  const updateRes = await aaravClient.put(`/groups/${groupId}`, {
    description: 'Updated: Autonomous agents sprint for Sphinx 2025!',
  });
  if (!updateRes.ok) throw new Error(`Update group failed: ${JSON.stringify(updateRes.data)}`);
  console.log(`✅ Updated description: "${updateRes.data.group.description}"`);

  // Step 11: Diya leaves the group
  console.log('\n1️⃣1️⃣ Diya leaves the group...');
  const leaveRes = await diyaClient.post(`/groups/${groupId}/leave`);
  if (!leaveRes.ok) throw new Error(`Leave failed: ${JSON.stringify(leaveRes.data)}`);
  console.log(`✅ ${leaveRes.data.message}`);

  // Verify Diya can no longer post
  const postAfterLeave = await diyaClient.post(`/groups/${groupId}/messages`, { content: 'Am I still here?' });
  if (postAfterLeave.status === 403) {
    console.log('✅ Correctly verified user can no longer post after leaving (403 Forbidden)');
  } else {
    throw new Error(`Expected 403 Forbidden after leaving, got: ${postAfterLeave.status}`);
  }

  // Step 12: Aarav invites Sneha, Sneha declines
  console.log('\n1️⃣2️⃣ Aarav invites Sneha, and Sneha declines...');
  await aaravClient.post(`/groups/${groupId}/invitations`, { userId: snehaUser.id });
  const declineRes = await snehaClient.post(`/groups/${groupId}/invitations/decline`);
  if (!declineRes.ok) throw new Error(`Decline failed: ${JSON.stringify(declineRes.data)}`);
  console.log(`✅ ${declineRes.data.message}`);

  // Clean up test group
  await aaravClient.delete(`/groups/${groupId}`);
  console.log('\n🧹 Cleaned up test group.');

  console.log('\n🎉 ALL BACKEND GROUPS & WORKSPACE VERIFICATIONS PASSED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
