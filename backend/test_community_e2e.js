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
  console.log('🧪 Starting Community Page & Posts E2E Backend Verification...\n');

  // Step 1: Login Aarav and Diya
  console.log('1️⃣ Logging in test users...');
  const aaravClient = new ApiClient();
  const diyaClient = new ApiClient();

  const aaravLogin = await aaravClient.post('/auth/login', {
    email: '2023ucse042@mnit.ac.in',
    password: 'StrongPassword123',
  });
  if (!aaravLogin.ok) throw new Error(`Aarav login failed: ${JSON.stringify(aaravLogin.data)}`);
  console.log(`✅ Logged in Aarav: ${aaravLogin.data.user.name}`);

  const diyaLogin = await diyaClient.post('/auth/login', {
    email: '2024ucse101@mnit.ac.in',
    password: 'StrongPassword123',
  });
  if (!diyaLogin.ok) throw new Error(`Diya login failed: ${JSON.stringify(diyaLogin.data)}`);
  console.log(`✅ Logged in Diya: ${diyaLogin.data.user.name}\n`);

  // Step 2: Fetch all posts and check separate pinned announcements
  console.log('2️⃣ Fetching all community posts...');
  const postsRes = await aaravClient.get('/posts');
  if (!postsRes.ok) throw new Error(`Get posts failed: ${JSON.stringify(postsRes.data)}`);
  
  const { pinnedPosts, posts } = postsRes.data;
  console.log(`✅ Found ${pinnedPosts.length} pinned announcements and ${posts.length} student posts.`);
  if (pinnedPosts.length === 0) throw new Error('Expected at least 1 pinned announcement');
  console.log(`📌 Pinned Announcement: "${pinnedPosts[0].title}"`);

  // Step 3: Test Category Filter
  console.log('\n3️⃣ Testing category filter (category=Projects)...');
  const projectPostsRes = await aaravClient.get('/posts?category=Projects');
  if (!projectPostsRes.ok) throw new Error(`Category filter failed: ${JSON.stringify(projectPostsRes.data)}`);
  const projectPosts = [...projectPostsRes.data.pinnedPosts, ...projectPostsRes.data.posts];
  const allProjects = projectPosts.every((p) => p.category === 'Projects');
  if (!allProjects) throw new Error('Expected only Projects category posts');
  console.log(`✅ Category filter returned ${projectPosts.length} Project posts successfully.`);

  // Step 4: Test Search Filter
  console.log('\n4️⃣ Testing search filter (search=Nachos)...');
  const searchRes = await aaravClient.get('/posts?search=Nachos');
  if (!searchRes.ok) throw new Error(`Search failed: ${JSON.stringify(searchRes.data)}`);
  const searchResults = [...searchRes.data.pinnedPosts, ...searchRes.data.posts];
  if (searchResults.length === 0) throw new Error('Expected results for search "Nachos"');
  console.log(`✅ Search for "Nachos" returned ${searchResults.length} matching posts.`);

  // Step 5: Diya creates a new post
  console.log('\n5️⃣ Diya creates a new question post...');
  const createPostRes = await diyaClient.post('/posts', {
    title: 'How to trace memory leaks with valgrind in CS101 lab?',
    content: 'Running into segmentation faults when allocating dynamic arrays for linked list nodes. Any suggestions for debugging flags in gcc?',
    category: 'Questions',
    codeSnippet: 'int* arr = (int*)malloc(sizeof(int) * n);\nfor (int i = 0; i <= n; i++) { arr[i] = i; }',
    codeLanguage: 'c',
    tags: 'CS101,CProgramming,Valgrind,MemoryLeak',
  });
  if (!createPostRes.ok) throw new Error(`Create post failed: ${JSON.stringify(createPostRes.data)}`);
  const newPost = createPostRes.data.post;
  console.log(`✅ Post created: "${newPost.title}" (ID: ${newPost.id})`);

  // Step 6: Aarav adds a comment
  console.log('\n6️⃣ Aarav comments on Diya post...');
  const commentRes = await aaravClient.post(`/posts/${newPost.id}/comments`, {
    content: 'Check your loop condition: "i <= n" writes one element past the buffer. Use "i < n" and compile with -Wall -Wextra -g3.',
  });
  if (!commentRes.ok) throw new Error(`Comment failed: ${JSON.stringify(commentRes.data)}`);
  const comment = commentRes.data.comment;
  console.log(`✅ Comment added by Aarav: "${comment.content}" (ID: ${comment.id})`);

  // Step 7: Diya replies to Aarav comment
  console.log('\n7️⃣ Diya replies to Aarav comment...');
  const replyRes = await diyaClient.post(`/posts/${newPost.id}/comments`, {
    content: 'That was exactly it! The off-by-one error was corrupting the heap metadata. Thanks Aarav!',
    parentId: comment.id,
  });
  if (!replyRes.ok) throw new Error(`Reply failed: ${JSON.stringify(replyRes.data)}`);
  console.log(`✅ Reply added by Diya: "${replyRes.data.comment.content}"`);

  // Step 8: Verify comments tree structure
  console.log('\n8️⃣ Verifying nested comments tree on post...');
  const singlePostRes = await aaravClient.get(`/posts/${newPost.id}`);
  if (!singlePostRes.ok) throw new Error(`Get single post failed: ${JSON.stringify(singlePostRes.data)}`);
  const fetchedPost = singlePostRes.data.post;
  if (fetchedPost.comments.length !== 1) throw new Error(`Expected 1 top-level comment, got ${fetchedPost.comments.length}`);
  if (fetchedPost.comments[0].replies.length !== 1) throw new Error(`Expected 1 reply, got ${fetchedPost.comments[0].replies.length}`);
  console.log(`✅ Threaded comment hierarchy verified: 1 top-level comment with 1 nested reply.`);

  // Step 9: Author-only permissions test: Aarav tries to edit Diya's post
  console.log('\n9️⃣ Verify Aarav (non-author) CANNOT edit or delete Diya post...');
  const unauthorizedEdit = await aaravClient.put(`/posts/${newPost.id}`, { title: 'Hacked Title' });
  if (unauthorizedEdit.status === 403) {
    console.log('✅ Correctly blocked non-author from editing post (403 Forbidden)');
  } else {
    throw new Error(`Expected 403 Forbidden for non-author edit, got: ${unauthorizedEdit.status}`);
  }

  const unauthorizedDelete = await aaravClient.delete(`/posts/${newPost.id}`);
  if (unauthorizedDelete.status === 403) {
    console.log('✅ Correctly blocked non-author from deleting post (403 Forbidden)');
  } else {
    throw new Error(`Expected 403 Forbidden for non-author delete, got: ${unauthorizedDelete.status}`);
  }

  // Step 10: Diya (author) edits her post
  console.log('\n🔟 Diya (author) edits her post title...');
  const updateRes = await diyaClient.put(`/posts/${newPost.id}`, {
    title: '[SOLVED] How to trace memory leaks with valgrind in CS101 lab?',
  });
  if (!updateRes.ok) throw new Error(`Update post failed: ${JSON.stringify(updateRes.data)}`);
  console.log(`✅ Updated title: "${updateRes.data.post.title}"`);

  // Step 11: Diya deletes her post
  console.log('\n1️⃣1️⃣ Diya deletes her post...');
  const deleteRes = await diyaClient.delete(`/posts/${newPost.id}`);
  if (!deleteRes.ok) throw new Error(`Delete post failed: ${JSON.stringify(deleteRes.data)}`);
  console.log(`✅ ${deleteRes.data.message}`);

  // Step 12: Verify post is gone
  const verifyGone = await aaravClient.get(`/posts/${newPost.id}`);
  if (verifyGone.status === 404) {
    console.log('✅ Confirmed post was deleted (404 Not Found)');
  } else {
    throw new Error(`Expected 404 Not Found, got: ${verifyGone.status}`);
  }

  console.log('\n🎉 ALL BACKEND COMMUNITY & POSTS TESTS PASSED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
