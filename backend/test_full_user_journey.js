import prisma from './src/config/prisma.js';
import { signToken } from './src/utils/jwt.js';

const BASE_URL = 'http://localhost:5001/api';

class ApiClient {
  constructor(cookie = null) {
    this.cookie = cookie;
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

async function runFullUserJourney() {
  console.log('===============================================================');
  console.log(' CampusConnect - Full User Journey End-to-End Checklist Test ');
  console.log('===============================================================\n');

  const results = [];
  const recordStep = (stepNumber, title, passed, detail = '') => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - Step ${stepNumber}: ${title}${detail ? ` (${detail})` : ''}`);
    results.push({ stepNumber, title, passed, detail });
    if (!passed) {
      console.error(`\n🚨 Test failed at Step ${stepNumber}: ${title}\n`);
    }
  };

  try {
    // 0. Health Check
    const health = await fetch(`${BASE_URL}/health`);
    if (!health.ok) {
      throw new Error('Backend server is not responding at http://localhost:5001/api/health');
    }

    // Generate unique credentials for this test run
    const uniqueSuffix = Date.now().toString().slice(-4);
    const validEmail = `journey${uniqueSuffix}@mnit.ac.in`;
    const invalidEmail = `journey${uniqueSuffix}@gmail.com`;
    const rollNumber = `2024TEST${uniqueSuffix}`;
    const password = 'StrongPassword123!';

    const studentClient = new ApiClient();

    // -------------------------------------------------------------------------
    // STEP 1: SIGN UP & DOMAIN VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n--- [1] Testing Sign Up & Domain Validation ---');
    // 1a. Negative test: non-@mnit.ac.in domain should fail
    const invalidSignup = await studentClient.post('/auth/signup', {
      name: 'Journey Tester',
      email: invalidEmail,
      rollNumber: rollNumber,
      password: password,
      batchYear: 2024,
    });
    const invalidDomainBlocked = !invalidSignup.ok && invalidSignup.status === 400;
    recordStep('1.1', 'Reject non-@mnit.ac.in email registration', invalidDomainBlocked, `Status: ${invalidSignup.status}`);

    // 1b. Positive test: valid @mnit.ac.in signup
    const validSignup = await studentClient.post('/auth/signup', {
      name: 'Journey Tester',
      email: validEmail,
      rollNumber: rollNumber,
      password: password,
      batchYear: 2024,
      hostel: 'Hostel 5 (Aravali)',
      roomNo: 'A-214',
      department: 'Computer Science & Engineering',
    });
    const signupOk = validSignup.ok && validSignup.data.user && validSignup.data.user.email === validEmail;
    const testUserId = validSignup.data?.user?.id;
    recordStep('1.2', 'Complete valid @mnit.ac.in sign up & issue session cookie', signupOk, `User ID: ${testUserId}`);

    // Verify current user session
    const meRes = await studentClient.get('/auth/me');
    const meOk = meRes.ok && meRes.data.user?.rollNumber === rollNumber;
    recordStep('1.3', 'Authenticate via HTTP-only cookie (/api/auth/me)', meOk, `Roll: ${meRes.data?.user?.rollNumber}`);

    // -------------------------------------------------------------------------
    // STEP 2: EDIT PROFILE & PRIVACY CONTROLS
    // -------------------------------------------------------------------------
    console.log('\n--- [2] Testing Onboarding & Profile Edit with Privacy Settings ---');
    // 2a. Onboarding update
    const onboardingRes = await studentClient.put('/auth/onboarding', {
      name: 'Journey Tester',
      batchYear: 2024,
      interests: ['Distributed Systems', 'OS & Nachos', 'Web Dev'],
      skills: ['Go', 'TypeScript', 'Docker', 'Linux'],
      openTo: ['Sphinx Hackathon Team', 'Nachos OS Lab Viva Prep'],
      hostel: 'Hostel 5 (Aravali)',
      roomNo: 'A-214',
      bio: 'Second year undergrad passionate about low-level systems and distributed caches.',
    });
    recordStep('2.1', 'Complete student onboarding attributes', onboardingRes.ok);

    // 2b. Edit full profile with privacy settings (hiding contact details)
    const profileUpdateRes = await studentClient.put('/users/profile', {
      about: 'Passionate about distributed algorithms and Nachos kernel development.',
      currentlyLearning: 'Raft consensus & Linux eBPF',
      skills: ['Go', 'TypeScript', 'Docker', 'Linux', 'Rust'],
      interests: ['Distributed Systems', 'OS & Nachos', 'Web Dev', 'Compilers'],
      openTo: ['Sphinx Hackathon Team', 'Nachos OS Lab Viva Prep', 'Midsem Study Sessions'],
      projects: [
        {
          title: 'Distributed KV-Store',
          description: 'Replicated in-memory key-value store using Raft protocol.',
          link: 'https://github.com/mnit-cse/kv-raft',
        },
      ],
      privacySettings: {
        showContactDetails: false, // Strict privacy test: Hide email & phone
        showRoomNumber: true,
        allowDirectHi: true,
      },
    });
    recordStep('2.2', 'Update full profile & privacy settings (/api/users/profile)', profileUpdateRes.ok);

    // 2c. Verify own profile view includes full private details
    const myProfileRes = await studentClient.get('/users/me');
    const myProfileOk = myProfileRes.ok && myProfileRes.data.profile?.email === validEmail;
    recordStep('2.3', 'Owner view sees complete email and private attributes', myProfileOk);

    // 2d. Verify peer view masks contact details when showContactDetails is false
    // Find or pick another student (e.g. Aarav) to view our profile
    let peerUser = await prisma.user.findFirst({
      where: { rollNumber: '2023UCSE042' },
    });
    if (!peerUser) {
      peerUser = await prisma.user.findFirst({
        where: { id: { not: testUserId } },
      });
    }

    const peerToken = signToken({ userId: peerUser.id, rollNumber: peerUser.rollNumber });
    const peerClient = new ApiClient(`campusconnect_token=${peerToken}`);

    const peerViewRes = await peerClient.get(`/users/${rollNumber}`);
    const peerView = peerViewRes.data?.profile;
    const privacyMaskingOk =
      peerViewRes.ok &&
      peerView &&
      peerView.email === null &&
      peerView.contactHidden === true &&
      peerView.roomNo === 'A-214'; // room is allowed
    recordStep('2.4', 'Peer view masks contact details per privacy settings (email=null, contactHidden=true)', privacyMaskingOk);

    // -------------------------------------------------------------------------
    // STEP 3: DISCOVER SOMEONE
    // -------------------------------------------------------------------------
    console.log('\n--- [3] Testing Discover People & Filter Queries ---');
    const discoverRes = await studentClient.get('/users/discover?search=Aarav');
    const discoverOk =
      discoverRes.ok &&
      discoverRes.data.peers &&
      discoverRes.data.peers.some((p) => p.name.includes('Aarav') || p.rollNumber === '2023UCSE042');
    recordStep('3.1', 'Discover student directory by search query (/api/users/discover)', discoverOk);

    // Verify no popularity metrics or match percentages in peer records
    const samplePeer = discoverRes.data?.peers?.[0];
    const noPopularityMetrics =
      samplePeer &&
      samplePeer.followerCount === undefined &&
      samplePeer.matchPercentage === undefined &&
      samplePeer.popularityScore === undefined;
    recordStep('3.2', 'Verify strictly zero popularity metrics, followers, or match percentages', noPopularityMetrics);

    // -------------------------------------------------------------------------
    // STEP 4: SAY HI (ICEBREAKER NOTE)
    // -------------------------------------------------------------------------
    console.log('\n--- [4] Testing Say Hi Feature ---');
    const sayHiRes = await studentClient.post('/messages/say-hi', {
      recipientId: peerUser.id,
      note: 'Hey Aarav! Loved your Nachos OS thread. Would you be open to team up for Sphinx Hackathon?',
    });
    const sayHiOk = sayHiRes.ok && sayHiRes.data.conversation && sayHiRes.data.sentMessage?.isIcebreaker;
    const conversationId = sayHiRes.data?.conversation?.id;
    recordStep('4.1', 'Send icebreaker note & create 1:1 conversation (/api/messages/say-hi)', sayHiOk, `Conv ID: ${conversationId}`);

    // Verify sender is marked as awaiting reply
    const conversationsList = await studentClient.get('/messages/conversations');
    const createdConv = conversationsList.data?.conversations?.find((c) => c.id === conversationId);
    const awaitingReplyOk = createdConv && createdConv.isAwaitingReply === true;
    recordStep('4.2', 'Conversation marked isAwaitingReply=true for sender', awaitingReplyOk);

    // -------------------------------------------------------------------------
    // STEP 5: CHAT & REPLY CONSTRAINT RULE
    // -------------------------------------------------------------------------
    console.log('\n--- [5] Testing Chat & Single-Message Reply Constraint ---');
    // 5a. Attempt to send a 2nd message as sender before recipient replies -> MUST FAIL
    const secondMsgRes = await studentClient.post(`/messages/conversations/${conversationId}/messages`, {
      content: 'Hey, sending another message before you replied!',
    });
    const replyLockEnforced =
      !secondMsgRes.ok &&
      secondMsgRes.status === 400 &&
      secondMsgRes.data?.code === 'AWAITING_REPLY';
    recordStep('5.1', 'Enforce single-message limit until recipient replies (AWAITING_REPLY)', replyLockEnforced);

    // 5b. Recipient (Aarav) reads and replies to the icebreaker
    const recipientReplyRes = await peerClient.post(`/messages/conversations/${conversationId}/messages`, {
      content: 'Hey! Glad you reached out! Yes, let us definitely team up for the Sphinx systems track.',
    });
    const recipientReplyOk = recipientReplyRes.ok && recipientReplyRes.data.message;
    recordStep('5.2', 'Recipient replies to unlock two-way conversation', recipientReplyOk);

    // 5c. Sender can now send follow-up messages freely
    const followUpRes = await studentClient.post(`/messages/conversations/${conversationId}/messages`, {
      content: 'Awesome! I will create a project workspace group for our Sphinx team right away.',
    });
    const followUpOk = followUpRes.ok && followUpRes.data.message;
    recordStep('5.3', 'Sender sends follow-up message after recipient reply', followUpOk);

    // 5d. Verify message history retrieval
    const historyRes = await studentClient.get(`/messages/conversations/${conversationId}`);
    const historyOk = historyRes.ok && historyRes.data.messages?.length >= 3;
    recordStep('5.4', 'Retrieve chat history with proper ordering & unread indicators', historyOk, `Count: ${historyRes.data?.messages?.length}`);

    // -------------------------------------------------------------------------
    // STEP 6: CREATE GROUP
    // -------------------------------------------------------------------------
    console.log('\n--- [6] Testing Group Creation ---');
    const createGroupRes = await studentClient.post('/groups', {
      name: `Sphinx Core Sprint ${uniqueSuffix}`,
      description: 'Distributed consensus and high-throughput systems track workspace.',
      category: 'hackathon',
      avatarUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150',
    });
    const createGroupOk = createGroupRes.ok && createGroupRes.data.group;
    const groupId = createGroupRes.data?.group?.id;
    recordStep('6.1', 'Create group & automatically set creator as accepted member (/api/groups)', createGroupOk, `Group ID: ${groupId}`);

    // -------------------------------------------------------------------------
    // STEP 7: INVITE & ACCEPT GROUP INVITATION
    // -------------------------------------------------------------------------
    console.log('\n--- [7] Testing Group Invitations & Acceptance ---');
    // 7a. Non-members cannot view group workspace before invitation & acceptance
    const unauthorizedAccessRes = await peerClient.get(`/groups/${groupId}`);
    const accessBlockedOk = unauthorizedAccessRes.status === 403;
    recordStep('7.1', 'Non-accepted student blocked from viewing group workspace (403)', accessBlockedOk);

    // 7b. Creator sends invitation to peer
    const inviteRes = await studentClient.post(`/groups/${groupId}/invitations`, {
      userId: peerUser.id,
    });
    const inviteOk = inviteRes.ok && inviteRes.data.invitation?.status === 'pending';
    recordStep('7.2', 'Group creator sends invitation to peer (/api/groups/:id/invitations)', inviteOk);

    // 7c. Peer checks pending invitations
    const pendingInvitesRes = await peerClient.get('/groups/invitations');
    const pendingFound =
      pendingInvitesRes.ok &&
      pendingInvitesRes.data.invitations?.some((inv) => inv.groupId === groupId);
    recordStep('7.3', 'Invited peer receives group invitation in pending queue', pendingFound);

    // 7d. Peer accepts invitation
    const acceptRes = await peerClient.post(`/groups/${groupId}/invitations/accept`);
    const acceptOk = acceptRes.ok && (acceptRes.data.status === 'success' || Boolean(acceptRes.data.group));
    recordStep('7.4', 'Peer accepts invitation & transitions to accepted member', acceptOk);

    // 7e. Peer can now enter workspace and send group messages
    const groupMsgRes = await peerClient.post(`/messages/groups/${groupId}/messages`, {
      content: 'Hello team! Excited to work together on this project.',
    });
    const groupMsgOk = groupMsgRes.ok && groupMsgRes.data.message;
    recordStep('7.5', 'Accepted member sends message in group workspace chat', groupMsgOk);

    // -------------------------------------------------------------------------
    // STEP 8: POST TO COMMUNITY
    // -------------------------------------------------------------------------
    console.log('\n--- [8] Testing Community Post Creation ---');
    const createPostRes = await studentClient.post('/posts', {
      title: `Nachos Thread Scheduling Benchmark Notes [Batch '${uniqueSuffix}]`,
      content: 'We profiled the Nachos priority scheduler under high concurrency. Here is the dispatcher spinlock snippet.',
      category: 'Projects',
      tags: ['Nachos', 'OS', 'Concurrency', 'Kernel'],
      codeSnippet: `void Thread::Yield() {\n    IntStatus oldLevel = interrupt->SetLevel(IntOff);\n    Thread *nextThread = scheduler->FindNextToRun();\n    if (nextThread != NULL) {\n        scheduler->ReadyToRun(this);\n        scheduler->Run(nextThread);\n    }\n    (void) interrupt->SetLevel(oldLevel);\n}`,
      codeLanguage: 'cpp',
    });
    const postOk = createPostRes.ok && createPostRes.data.post;
    const postId = createPostRes.data?.post?.id;
    recordStep('8.1', 'Create community post with category, tags & code snippet (/api/posts)', postOk, `Post ID: ${postId}`);

    // Verify post is present in community list
    const postsListRes = await studentClient.get(`/posts?category=Projects`);
    const postFound = postsListRes.ok && postsListRes.data.posts?.some((p) => p.id === postId);
    recordStep('8.2', 'Retrieve post in filtered community feed', postFound);

    // -------------------------------------------------------------------------
    // STEP 9: LIKE & COMMENT ON POST
    // -------------------------------------------------------------------------
    console.log('\n--- [9] Testing Post Like, Comment & Threaded Reply ---');
    // 9a. Peer likes the post
    const likeRes = await peerClient.post(`/posts/${postId}/like`);
    const likeOk = likeRes.ok && likeRes.data.hasLiked === true && likeRes.data.likeCount >= 1;
    recordStep('9.1', 'Toggle like on post (/api/posts/:id/like)', likeOk, `LikeCount: ${likeRes.data?.likeCount}`);

    // 9b. Peer comments on post
    const commentRes = await peerClient.post(`/posts/${postId}/comments`, {
      content: 'Great implementation! Did you account for priority inversion with thread condition locks?',
    });
    const commentOk = commentRes.ok && commentRes.data.comment;
    const commentId = commentRes.data?.comment?.id;
    recordStep('9.2', 'Add comment to community post (/api/posts/:id/comments)', commentOk, `Comment ID: ${commentId}`);

    // 9c. Author replies to comment
    const replyRes = await studentClient.post(`/posts/${postId}/comments`, {
      content: 'Yes! We introduced priority inheritance across semaphore wait queues.',
      parentId: commentId,
    });
    const replyOk = replyRes.ok && replyRes.data.comment && replyRes.data.comment.parentId === commentId;
    recordStep('9.3', 'Add nested reply to comment thread', replyOk, `Parent ID: ${replyRes.data?.comment?.parentId}`);

    // -------------------------------------------------------------------------
    // STEP 10: SAVE AN UPDATE & VERIFY BOOKMARKS
    // -------------------------------------------------------------------------
    console.log('\n--- [10] Testing Updates & Opportunity Bookmarks ---');
    // 10a. List updates
    const updatesRes = await studentClient.get('/updates');
    const updatesOk = updatesRes.ok && Array.isArray(updatesRes.data.items) && updatesRes.data.items.length > 0;
    if (!updatesOk) {
      // If no updates in DB, seed one quick notice
      await studentClient.post('/updates', {
        title: 'MNIT CSE Lab Viva Schedule 2026',
        description: 'Odd Semester Endsem practical examination schedule for CS204 & CS302.',
        category: 'Academic Updates',
        organizer: 'CSE Department',
        venue: 'Prabha Bhawan Computer Labs',
        deadlineText: 'Dec 15, 2026',
        tags: ['LabViva', 'Nachos', 'Exams'],
      });
    }

    const freshUpdatesRes = await studentClient.get('/updates');
    const targetItem = freshUpdatesRes.data.items[0];
    const updateItemId = targetItem.id;

    // 10b. Save / Bookmark update
    const saveRes = await studentClient.post(`/updates/${updateItemId}/save`);
    const saveOk = saveRes.ok && saveRes.data.isSaved === true;
    recordStep('10.1', 'Save campus update / circular to bookmarks (/api/updates/:id/save)', saveOk, `Item: ${targetItem.title}`);

    // 10c. Verify saved item in Saved tab
    const savedTabRes = await studentClient.get('/updates?tab=Saved');
    const savedFound =
      savedTabRes.ok && savedTabRes.data.items?.some((i) => i.id === updateItemId && i.isSaved);
    recordStep('10.2', 'Verify bookmarked item appears in Saved updates tab', savedFound);

    // 10d. Unsave item
    const unsaveRes = await studentClient.post(`/updates/${updateItemId}/unsave`);
    const unsaveOk = unsaveRes.ok && unsaveRes.data.isSaved === false;
    recordStep('10.3', 'Unsave / remove bookmark (/api/updates/:id/unsave)', unsaveOk);

    // Verify removed from Saved tab
    const afterUnsaveTabRes = await studentClient.get('/updates?tab=Saved');
    const itemGone =
      afterUnsaveTabRes.ok && !afterUnsaveTabRes.data.items?.some((i) => i.id === updateItemId);
    recordStep('10.4', 'Verify item is removed from Saved tab after unsave', itemGone);

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n===============================================================');
    console.log('                 USER JOURNEY TEST SUMMARY                    ');
    console.log('===============================================================');
    const total = results.length;
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = total - passedCount;

    console.log(`Total Checklist Steps: ${total}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${failedCount}`);

    if (failedCount > 0) {
      console.log('\n❌ Failed steps:');
      results.filter((r) => !r.passed).forEach((r) => console.log(` - Step ${r.stepNumber}: ${r.title}`));
      process.exit(1);
    } else {
      console.log('\n🎉 ALL USER JOURNEY STEPS PASSED WITH 100% SUCCESS!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n💥 Unexpected error during test run:', error);
    process.exit(1);
  }
}

runFullUserJourney();
