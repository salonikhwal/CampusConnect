/**
 * test_updates_e2e.js
 * End-to-end test suite for Updates & Opportunities API
 */
const BASE_URL = 'http://localhost:5001/api';

async function run() {
  console.log('--- STARTING UPDATES & OPPORTUNITIES E2E TEST ---');

  // 1. Log in as Admin: Aarav Sharma (role: admin)
  console.log('\n[1] Logging in as Admin (Aarav Sharma)...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '2023ucse042@mnit.ac.in',
      password: 'StrongPassword123',
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  if (adminLoginRes.status !== 200) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
  }
  const adminCookie = adminLoginRes.headers.get('set-cookie');
  console.log('✓ Admin login successful. User:', adminLoginData.user.name, 'Role:', adminLoginData.user.role);
  if (adminLoginData.user.role !== 'admin') {
    throw new Error('Aarav should have role=admin');
  }

  // 2. Log in as Student: Diya Agarwal (role: student)
  console.log('\n[2] Logging in as Student (Diya Agarwal)...');
  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '2024ucse101@mnit.ac.in',
      password: 'StrongPassword123',
    }),
  });
  const studentLoginData = await studentLoginRes.json();
  if (studentLoginRes.status !== 200) {
    throw new Error(`Student login failed: ${JSON.stringify(studentLoginData)}`);
  }
  const studentCookie = studentLoginRes.headers.get('set-cookie');
  console.log('✓ Student login successful. User:', studentLoginData.user.name, 'Role:', studentLoginData.user.role);
  if (studentLoginData.user.role !== 'student') {
    throw new Error('Diya should have role=student');
  }

  // 3. Fetch all updates
  console.log('\n[3] Fetching all updates...');
  const allRes = await fetch(`${BASE_URL}/updates`, {
    headers: { Cookie: adminCookie },
  });
  const allData = await allRes.json();
  console.log(`✓ Fetched ${allData.items.length} items. Status: ${allRes.status}`);
  if (allData.items.length === 0) {
    throw new Error('Expected seeded items to be present.');
  }

  // 4. Test tabs filtering
  const tabs = ['Announcements', 'Academic Updates', 'Events', 'Opportunities', 'Saved'];
  for (const tab of tabs) {
    console.log(`\n[4] Testing tab: ${tab}...`);
    const tabRes = await fetch(`${BASE_URL}/updates?tab=${encodeURIComponent(tab)}`, {
      headers: { Cookie: adminCookie },
    });
    const tabData = await tabRes.json();
    console.log(`✓ Tab '${tab}' returned ${tabData.items.length} items.`);
    if (tab !== 'Saved') {
      const nonMatching = tabData.items.filter((i) => i.category !== tab);
      if (nonMatching.length > 0) {
        throw new Error(`Tab ${tab} returned items of mismatched category: ${nonMatching[0].category}`);
      }
    }
  }

  // 5. Permission Check: Student attempts to post official item -> Must fail with 403 Forbidden
  console.log('\n[5] Testing permission: Student attempting to post official item (should be 403)...');
  const studentForbiddenRes = await fetch(`${BASE_URL}/updates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      title: 'Fake Official Exam Postponement',
      description: 'Classes cancelled tomorrow due to rain.',
      category: 'Announcements',
      isOfficial: true,
    }),
  });
  const studentForbiddenData = await studentForbiddenRes.json();
  console.log(`Status: ${studentForbiddenRes.status}, Message: ${studentForbiddenData.message}`);
  if (studentForbiddenRes.status !== 403) {
    throw new Error(`Expected status 403 for student posting official item, got ${studentForbiddenRes.status}`);
  }
  console.log('✓ Student correctly prevented from posting official item.');

  // 6. Admin creates an official item
  console.log('\n[6] Admin creating official item...');
  const adminPostRes = await fetch(`${BASE_URL}/updates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: 'End-Term Examination Schedule Winter 2026',
      description: 'The final examination schedule for B.Tech Semester VII has been uploaded to ERP. Please report any clash by 5 PM Friday.',
      category: 'Academic Updates',
      organizer: 'Academic Section, Dean Academics',
      venue: 'Prabha Bhawan / Central Exam Hall',
      deadline: '2026-11-20T17:00:00.000Z',
      deadlineText: 'Report clashes by Nov 20, 5:00 PM',
      linkUrl: 'https://erpmsp.mnit.ac.in',
      tags: ['Academics', 'ExamSchedule', 'OfficialNotice'],
      isOfficial: true,
    }),
  });
  const adminPostData = await adminPostRes.json();
  if (adminPostRes.status !== 201 || !adminPostData.item.isOfficial) {
    throw new Error(`Admin failed to create official item: ${JSON.stringify(adminPostData)}`);
  }
  const createdOfficialId = adminPostData.item.id;
  console.log('✓ Admin created official item:', adminPostData.item.title, 'isOfficial:', adminPostData.item.isOfficial);

  // 7. Student creates a student-submitted item
  console.log('\n[7] Student creating student-submitted item...');
  const studentPostRes = await fetch(`${BASE_URL}/updates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      title: 'Competitive Programming Peer Study Group for ICPC Prelims',
      description: 'Hosting weekly 3-hour practice contests on Codeforces followed by editorial discussions in Gargi Hostel common room.',
      category: 'Opportunities',
      organizer: 'Diya Agarwal & Gargi Coders',
      venue: 'Gargi Hostel Common Room / Discord',
      deadlineText: 'First session this Saturday 6 PM',
      tags: ['CP', 'Codeforces', 'ICPC', 'PeerLearning'],
      isOfficial: false,
    }),
  });
  const studentPostData = await studentPostRes.json();
  if (studentPostRes.status !== 201 || studentPostData.item.isOfficial) {
    throw new Error(`Student item creation failed: ${JSON.stringify(studentPostData)}`);
  }
  const createdStudentId = studentPostData.item.id;
  console.log('✓ Student created peer item:', studentPostData.item.title, 'isOfficial:', studentPostData.item.isOfficial, 'Author:', studentPostData.item.author.name);

  // 8. Test Save and Unsave
  console.log('\n[8] Testing Save / Bookmark feature...');
  // Diya saves Aarav's official item
  const saveRes = await fetch(`${BASE_URL}/updates/${createdOfficialId}/save`, {
    method: 'POST',
    headers: { Cookie: studentCookie },
  });
  const saveData = await saveRes.json();
  console.log('Save response:', saveData);
  if (saveRes.status !== 200 || !saveData.isSaved) {
    throw new Error(`Failed to save item: ${JSON.stringify(saveData)}`);
  }

  // Verify item appears in Diya's Saved tab
  const savedTabRes = await fetch(`${BASE_URL}/updates?tab=Saved`, {
    headers: { Cookie: studentCookie },
  });
  const savedTabData = await savedTabRes.json();
  const foundSaved = savedTabData.items.find((i) => i.id === createdOfficialId);
  if (!foundSaved) {
    throw new Error('Saved item not found in student Saved tab!');
  }
  console.log('✓ Item confirmed present in Saved tab.');

  // Unsave item
  const unsaveRes = await fetch(`${BASE_URL}/updates/${createdOfficialId}/unsave`, {
    method: 'POST',
    headers: { Cookie: studentCookie },
  });
  const unsaveData = await unsaveRes.json();
  console.log('Unsave response:', unsaveData);
  if (unsaveRes.status !== 200 || unsaveData.isSaved !== false) {
    throw new Error(`Failed to unsave item: ${JSON.stringify(unsaveData)}`);
  }

  // Verify item is removed from Diya's Saved tab
  const savedTabAfterRes = await fetch(`${BASE_URL}/updates?tab=Saved`, {
    headers: { Cookie: studentCookie },
  });
  const savedTabAfterData = await savedTabAfterRes.json();
  const stillFound = savedTabAfterData.items.find((i) => i.id === createdOfficialId);
  if (stillFound) {
    throw new Error('Item still found in Saved tab after unsaving!');
  }
  console.log('✓ Item confirmed removed from Saved tab.');

  // 9. Search and Tags
  console.log('\n[9] Testing search and tags filter...');
  const searchRes = await fetch(`${BASE_URL}/updates?search=ICPC`, {
    headers: { Cookie: studentCookie },
  });
  const searchData = await searchRes.json();
  console.log(`Search for "ICPC" returned ${searchData.items.length} items.`);
  if (searchData.items.length === 0) {
    throw new Error('Expected at least 1 item matching ICPC search query.');
  }

  console.log('\n=============================================');
  console.log('🎉 ALL UPDATES & OPPORTUNITIES TESTS PASSED! 🎉');
  console.log('=============================================');
}

run().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
