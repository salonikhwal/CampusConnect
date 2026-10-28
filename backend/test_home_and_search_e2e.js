/**
 * test_home_and_search_e2e.js
 * Verification script for Home Dashboard data and Omni-search
 */
import prisma from './src/config/prisma.js';
import { signToken } from './src/utils/jwt.js';
import { config } from './src/config/env.js';

const BASE_URL = 'http://localhost:5001/api';

async function getAuthCookie(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  const token = signToken({ userId: user.id, rollNumber: user.rollNumber });
  return { user, cookie: `${config.cookieName}=${token}` };
}

async function run() {
  console.log('--- STARTING HOME DASHBOARD & OMNI-SEARCH E2E TEST ---');

  const aarav = await getAuthCookie('2023ucse042@mnit.ac.in');
  console.log('✓ Loaded Aarav Sharma');

  // 1. Test Omni-Search for People, Posts, Groups
  console.log('\n[1] Testing Omni-Search for "Nachos"...');
  const searchRes1 = await fetch(`${BASE_URL}/search?q=Nachos`, {
    headers: { Cookie: aarav.cookie },
  });
  const searchData1 = await searchRes1.json();
  console.log('Search "Nachos" results:', {
    people: searchData1.results.people.length,
    posts: searchData1.results.posts.length,
    groups: searchData1.results.groups.length,
  });
  if (searchRes1.status !== 200) throw new Error('Search failed');

  console.log('\n[2] Testing Omni-Search for "Sphinx"...');
  const searchRes2 = await fetch(`${BASE_URL}/search?q=Sphinx`, {
    headers: { Cookie: aarav.cookie },
  });
  const searchData2 = await searchRes2.json();
  console.log('Search "Sphinx" results:', {
    people: searchData2.results.people.length,
    posts: searchData2.results.posts.length,
    groups: searchData2.results.groups.length,
  });
  if (searchData2.results.groups.length === 0) {
    throw new Error('Expected Sphinx group in search results');
  }

  // 2. Test Pending Group Invitations
  console.log('\n[3] Testing Pending Group Invitations for Aarav...');
  const invRes = await fetch(`${BASE_URL}/groups/invitations`, {
    headers: { Cookie: aarav.cookie },
  });
  const invData = await invRes.json();
  console.log(`✓ Retrieved ${invData.invitations?.length || 0} pending invitations for Aarav.`);
  if (!invData.invitations || invData.invitations.length === 0) {
    throw new Error('Expected at least 1 pending group invitation for Aarav');
  }
  const inv = invData.invitations[0];
  console.log('Pending invitation details:', {
    groupName: inv.groupName,
    inviter: inv.invitedBy?.name,
    groupId: inv.groupId,
  });

  // 3. Test Community Feed Preview (Recent Posts)
  console.log('\n[4] Testing Community Feed Posts...');
  const postsRes = await fetch(`${BASE_URL}/posts`, {
    headers: { Cookie: aarav.cookie },
  });
  const postsData = await postsRes.json();
  console.log(`✓ Retrieved ${postsData.posts?.length || 0} posts from /api/posts`);
  if (!postsData.posts || postsData.posts.length === 0) {
    throw new Error('Expected community posts');
  }

  // 4. Test Pinned Announcements and Upcoming Events
  console.log('\n[5] Testing Pinned Announcements and Deadlines...');
  const updatesRes = await fetch(`${BASE_URL}/updates?isOfficial=true`, {
    headers: { Cookie: aarav.cookie },
  });
  const updatesData = await updatesRes.json();
  console.log(`✓ Retrieved ${updatesData.items?.length || 0} official notices & deadlines`);
  if (!updatesData.items || updatesData.items.length === 0) {
    throw new Error('Expected official notices');
  }

  // 5. Test People You May Know
  console.log('\n[6] Testing Discover People for "People You May Know"...');
  const discoverRes = await fetch(`${BASE_URL}/users/discover`, {
    headers: { Cookie: aarav.cookie },
  });
  const discoverData = await discoverRes.json();
  console.log(`✓ Retrieved ${discoverData.peers?.length || 0} peers for suggestions`);
  if (!discoverData.peers || discoverData.peers.length === 0) {
    throw new Error('Expected peers list for Home suggestions');
  }

  console.log('\n=============================================');
  console.log('🎉 ALL HOME & SEARCH API ENDPOINTS VERIFIED! 🎉');
  console.log('=============================================');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
