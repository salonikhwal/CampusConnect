import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';

async function seed() {
  console.log('Seeding campus directory, profiles, and initial data...');
  const defaultPassword = await bcrypt.hash('StrongPassword123', 10);

  const students = [
    {
      email: '2023ucse042@mnit.ac.in',
      name: 'Aarav Sharma',
      rollNumber: '2023UCSE042',
      batchYear: 2023, // 2nd Year '27
      department: 'Computer Science & Engineering',
      hostel: 'Hostel 4 (Kaveri)',
      roomNo: '218',
      labGroup: 'CC-03 (Slot B)',
      phone: '+91 98765 43210',
      bio: '2nd Year CSE • Building Nachos OS custom scheduler & Sphinx hackathon core.',
      about: '2nd Year B.Tech CSE student at MNIT Jaipur. Focused on OS internals, Nachos thread synchronization, and distributed systems. Always down for Nachos lab prep or evening chai at Prabha Bhawan.',
      currentlyLearning: 'Nachos OS MLFQ Scheduler, Raft Consensus Algorithm in Go',
      interests: JSON.stringify(['Systems Programming', 'Nachos OS & Kernels', 'Distributed Systems', 'Competitive Programming']),
      skills: JSON.stringify(['C/C++', 'Nachos OS', 'Linux Kernel', 'Python', 'Go', 'Docker', 'Git']),
      openTo: JSON.stringify(['☕ Chai at Prabha Bhawan', '💻 Nachos OS Lab Viva Prep', '🚀 Sphinx Hackathon Team', '🌙 Late Night Canteen Drill']),
      courses: 'CS201,CS202,CS203,CS204',
      privacySettings: JSON.stringify({
        showContactDetails: false,
        showRoomNumber: true,
        allowDirectHi: true,
        showSchedule: true,
      }),
      role: 'admin',
      isOnboarded: true,
    },
    {
      email: '2024ucse101@mnit.ac.in',
      name: 'Diya Agarwal',
      rollNumber: '2024UCSE101',
      batchYear: 2024, // 1st Year '28
      department: 'Computer Science & Engineering',
      hostel: 'Gargi Hostel',
      roomNo: '304',
      labGroup: 'CC-01',
      phone: '+91 91234 56789',
      bio: '1st Year CSE • Exploring systems programming & open source.',
      about: '1st Year B.Tech CSE student. Exploring C programming fundamentals, system architecture, and open source development.',
      currentlyLearning: 'Memory allocation in C, Pointers & Linked Lists, Linux CLI tools',
      interests: JSON.stringify(['C Programming', 'Algorithms', 'Web Development', 'Open Source']),
      skills: JSON.stringify(['C', 'Python', 'HTML/CSS', 'Git', 'Linux']),
      openTo: JSON.stringify(['☕ Chai at Prabha Bhawan', '📚 Midsem / Endsem Study Sessions', '💻 Lab Study Partner']),
      courses: 'CS101,CS102,MA101,PH101',
      privacySettings: JSON.stringify({
        showContactDetails: false,
        showRoomNumber: false,
        allowDirectHi: true,
        showSchedule: true,
      }),
      isOnboarded: true,
    },
    {
      email: '2023ucse088@mnit.ac.in',
      name: 'Sneha Agarwal',
      rollNumber: '2023UCSE088',
      batchYear: 2023, // 2nd Year '27
      department: 'Computer Science & Engineering',
      hostel: 'Gargi Hostel',
      roomNo: '112',
      labGroup: 'CC-02',
      phone: '+91 99887 76655',
      bio: 'Exploring modern frontend tools and design systems. Looking for peers to build React tools for college.',
      about: 'Passionate about human-computer interaction, accessible web design, and performant web apps. Building component systems for campus clubs.',
      currentlyLearning: 'CSS Anchor Positioning, Web Components, Vite internals',
      interests: JSON.stringify(['Web Development', 'UI/UX Design', 'Design Systems', 'Open Source']),
      skills: JSON.stringify(['React', 'TypeScript', 'Tailwind CSS', 'Figma', 'Next.js', 'Git']),
      openTo: JSON.stringify(['🎨 Design Critiques & UI Reviews', '🚀 Sphinx Hackathon Team', '☕ Chai at Prabha Bhawan']),
      courses: 'CS201,CS202,CS204',
      privacySettings: JSON.stringify({
        showContactDetails: true,
        showRoomNumber: true,
        allowDirectHi: true,
        showSchedule: true,
      }),
      isOnboarded: true,
    },
    {
      email: '2022ucse034@mnit.ac.in',
      name: 'Devendra Singh',
      rollNumber: '2022UCSE034',
      batchYear: 2022, // 3rd Year '26
      department: 'Computer Science & Engineering',
      hostel: 'Hostel 5',
      roomNo: '112',
      labGroup: 'CC-05',
      phone: '+91 97654 32109',
      bio: '3rd Year CSE • Active on Codeforces & AtCoder. Focusing on graph algorithms and clean CP implementations.',
      about: '3rd Year B.Tech CSE. Candidate Master on Codeforces. Focusing on graph algorithms, segment trees, and algorithm design.',
      currentlyLearning: 'Dynamic Programming on Trees, Fast I/O in C++, Distributed Databases',
      interests: JSON.stringify(['Competitive Programming', 'DSA & CP', 'Algorithms', 'Systems Programming']),
      skills: JSON.stringify(['C++', 'Python', 'Algorithms', 'Data Structures', 'Linux']),
      openTo: JSON.stringify(['⚔️ Virtual Contest Upsolving', '📚 Midsem / Endsem Study Sessions', '💻 Lab Study Partner']),
      courses: 'CS301,CS302,CS304',
      isGuidanceProvider: true,
      guidanceTopics: JSON.stringify(['Competitive Programming', 'Graph Theory & DP', 'Tree Algorithms', 'Contest Upsolving']),
      guidanceBio: 'Here to help 1st and 2nd years demystify competitive programming, dynamic programming patterns, and time complexity optimization.',
      guidanceAvailability: 'Tuesdays & Thursdays 6:00 PM – 8:00 PM (Prabha Bhawan / Hostel 5)',
      privacySettings: JSON.stringify({
        showContactDetails: false,
        showRoomNumber: true,
        allowDirectHi: true,
        showSchedule: false,
      }),
      isOnboarded: true,
    },
    {
      email: '2021ucse019@mnit.ac.in',
      name: 'Kartik Dave',
      rollNumber: '2021UCSE019',
      batchYear: 2021, // Final Year '25
      department: 'Computer Science & Engineering',
      hostel: 'Hostel 3',
      roomNo: '401',
      labGroup: 'CC-Honors',
      phone: '+91 98112 23344',
      bio: '4th Year CSE • Passionate about OS kernels, Nachos viva prep, and distributed databases.',
      about: 'Final-year CSE undergrad at MNIT Jaipur. Deeply interested in operating systems, DBMS internals, and distributed systems. Guided multiple batches of juniors through CS204 Nachos labs and core electives.',
      currentlyLearning: 'Consensus protocols, Database storage engines, Rust',
      interests: JSON.stringify(['Distributed Systems', 'Systems & OS', 'AI/ML', 'Interviews & Career']),
      skills: JSON.stringify(['Go', 'C++', 'Rust', 'Kubernetes', 'Distributed Systems', 'SQL']),
      openTo: JSON.stringify(['🎓 Senior Guidance & Mentorship', '📝 Resume & Interview Mock Sessions', '☕ Chai at Prabha Bhawan']),
      courses: 'CS401,CS402',
      isGuidanceProvider: true,
      guidanceTopics: JSON.stringify(['Nachos OS Lab', 'Distributed Systems', 'DBMS Internals', 'Course Electives', 'Systems Projects']),
      guidanceBio: 'Happy to guide 2nd and 3rd years through Nachos OS synchronization, DBMS transaction internals, and choosing department electives.',
      guidanceAvailability: 'Fridays 4:00 PM – 6:00 PM in Computer Center 3 or via Discord',
      privacySettings: JSON.stringify({
        showContactDetails: true,
        showRoomNumber: false,
        allowDirectHi: true,
        showSchedule: true,
      }),
      role: 'admin',
      isOnboarded: true,
    },
    {
      email: '2021ucse045@mnit.ac.in',
      name: 'Ritika Sen',
      rollNumber: '2021UCSE045',
      batchYear: 2021, // Final Year '25
      department: 'Computer Science & Engineering',
      hostel: 'Gargi Hostel',
      roomNo: '312',
      labGroup: 'CC-04',
      phone: '+91 98334 55667',
      bio: '4th Year CSE • Distributed storage, Docker/K8s, and open source research.',
      about: 'Final year CSE student. Contributor to open source distributed systems tooling. Passionate about helping juniors write their first open source PR and approaching faculty for research.',
      currentlyLearning: 'Storage engines, Consensus algorithms, eBPF in Linux',
      interests: JSON.stringify(['Distributed Systems', 'Cloud & DevOps', 'Open Source', 'Operating Systems']),
      skills: JSON.stringify(['Go', 'Docker', 'Kubernetes', 'Python', 'Linux', 'Git']),
      openTo: JSON.stringify(['🎓 Senior Guidance & Mentorship', '🚀 Open Source PR Reviews', '☕ Chai at Prabha Bhawan']),
      courses: 'CS401,CS403',
      isGuidanceProvider: true,
      guidanceTopics: JSON.stringify(['Open Source & GSoC', 'Research & BTP', 'Distributed Systems', 'Women in Tech']),
      guidanceBio: 'Can assist with getting started in open source, preparing proposal drafts, and setting up Linux/Docker dev environments.',
      guidanceAvailability: 'Wednesdays 5:00 PM in Central Library / Google Meet',
      privacySettings: JSON.stringify({
        showContactDetails: false,
        showRoomNumber: true,
        allowDirectHi: true,
        showSchedule: true,
      }),
      isOnboarded: true,
    },
    {
      email: '2022ucse012@mnit.ac.in',
      name: 'Vikram Rathore',
      rollNumber: '2022UCSE012',
      batchYear: 2022, // 3rd Year '26
      department: 'Computer Science & Engineering',
      hostel: 'Hostel 3',
      roomNo: '204',
      labGroup: 'CC-03',
      phone: '+91 98777 66554',
      bio: '3rd Year CSE • Systems architecture, Linux tools, and hackathon projects.',
      about: '3rd Year CSE undergrad. Experienced with Sphinx hackathons, full-stack systems in Go/C++, and building real tools for campus.',
      currentlyLearning: 'Linux network stack, High-concurrency WebSockets, C++20',
      interests: JSON.stringify(['Systems Programming', 'Competitive Programming', 'Hackathons', 'Linux Tools']),
      skills: JSON.stringify(['C++', 'Go', 'Linux', 'Git', 'Algorithms']),
      openTo: JSON.stringify(['🚀 Sphinx Hackathon Team', '🎓 Senior Guidance & Mentorship', '⚔️ Virtual Contest Upsolving']),
      courses: 'CS301,CS302',
      isGuidanceProvider: true,
      guidanceTopics: JSON.stringify(['Systems Projects', 'Campus Life & Hackathons', 'Linux Tools & Shell', 'Competitive Programming']),
      guidanceBio: 'Open to reviewing project architecture, discussing hackathon ideas, and Linux/Git tips.',
      guidanceAvailability: 'Saturday afternoons in Hostel 3 common room',
      privacySettings: JSON.stringify({
        showContactDetails: false,
        showRoomNumber: true,
        allowDirectHi: true,
        showSchedule: true,
      }),
      isOnboarded: true,
    },
    {
      email: '2024ucse105@mnit.ac.in',
      name: 'Ananya Joshi',
      rollNumber: '2024UCSE105',
      batchYear: 2024, // 1st Year '28
      department: 'Computer Science & Engineering',
      hostel: 'Gargi Hostel',
      roomNo: '205',
      labGroup: 'CC-01',
      phone: '+91 93456 78901',
      bio: 'Freshman curious about open source and web dev. Asking lots of questions about lab viva prep!',
      about: 'First year exploring college tech clubs. Interested in web development, python automation, and Linux scripting.',
      currentlyLearning: 'Full stack development, Git branch workflows, C pointer math',
      interests: JSON.stringify(['Web Development', 'Open Source', 'DSA & CP', 'Python Automation']),
      skills: JSON.stringify(['JavaScript', 'Python', 'HTML/CSS', 'Git']),
      openTo: JSON.stringify(['💻 Lab Study Partner', '☕ Chai at Prabha Bhawan', '📚 Midsem / Endsem Study Sessions']),
      courses: 'CS101,CS102,MA101',
      privacySettings: JSON.stringify({
        showContactDetails: false,
        showRoomNumber: false,
        allowDirectHi: true,
        showSchedule: true,
      }),
      isOnboarded: true,
    },
    {
      email: '2023ucse051@mnit.ac.in',
      name: 'Priya Sharma',
      rollNumber: '2023UCSE051',
      batchYear: 2023, // 2nd Year '27
      department: 'Computer Science & Engineering',
      hostel: 'Gargi Hostel',
      roomNo: '310',
      labGroup: 'CC-03',
      phone: '+91 94567 89012',
      bio: 'Study buddy for CS204 OS Lab 3. Sharing notes on synchronization primitives and semaphores.',
      about: '2nd year student keen on system architecture, database design, and cloud infrastructures.',
      currentlyLearning: 'POSIX Semaphores, Mutex locks, Nachos OS syscalls',
      interests: JSON.stringify(['Systems & OS', 'Web Development', 'Database Internals', 'Cloud Computing']),
      skills: JSON.stringify(['C', 'C++', 'Java', 'SQL', 'Linux']),
      openTo: JSON.stringify(['💻 Nachos OS Lab Viva Prep', '📚 Midsem / Endsem Study Sessions', '🚀 Sphinx Hackathon Team']),
      courses: 'CS201,CS202,CS204',
      privacySettings: JSON.stringify({
        showContactDetails: true,
        showRoomNumber: true,
        allowDirectHi: true,
        showSchedule: true,
      }),
      isOnboarded: true,
    },
  ];

  for (const s of students) {
    const existing = await prisma.user.findUnique({
      where: { rollNumber: s.rollNumber },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          ...s,
          password: defaultPassword,
        },
      });
      console.log(`Updated user: ${s.name} (${s.rollNumber})`);
    } else {
      await prisma.user.create({
        data: {
          ...s,
          password: defaultPassword,
        },
      });
      console.log(`Created user: ${s.name} (${s.rollNumber})`);
    }
  }

  // Seed sample initial posts for Aarav
  const aarav = await prisma.user.findUnique({ where: { rollNumber: '2023UCSE042' } });
  const diya = await prisma.user.findUnique({ where: { rollNumber: '2024UCSE101' } });
  const sneha = await prisma.user.findUnique({ where: { rollNumber: '2023UCSE088' } });
  const devendra = await prisma.user.findUnique({ where: { rollNumber: '2022UCSE034' } });
  const kartik = await prisma.user.findUnique({ where: { rollNumber: '2021UCSE019' } });
  const priya = await prisma.user.findUnique({ where: { rollNumber: '2023UCSE051' } });

  if (aarav && diya && sneha && devendra && kartik) {
    // Clear old posts and comments
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});

    // 1. Pinned Announcement 1: Sphinx Hackathon Qualifier
    const pinned1 = await prisma.post.create({
      data: {
        authorId: kartik.id,
        title: '📢 Sphinx 2025 Inter-Hostel Hackathon Sprint: Problem Statements & CC-3 Access',
        content: 'Sphinx Hackathon 2025 Internal CSE Qualifier is now open! Track 1: Offline Campus Mesh Networks. Track 2: Automated Lab Resource Allocator. Computer Center 3 will remain open 24/7 during the sprint. All hostel teams must register through CampusConnect before Friday 6 PM.',
        category: 'Opportunities',
        tags: 'Sphinx2025,Hackathon,CC03,RajasthanSprint',
        isPinned: true,
      },
    });

    // 2. Pinned Announcement 2: CS204 OS Lab Viva Schedule
    const pinned2 = await prisma.post.create({
      data: {
        authorId: kartik.id,
        title: '📌 CS204 Operating Systems Lab 2 Viva Schedule & Thread Invariants',
        content: 'CS204 OS Lab 2 (Threads & Synchronization) viva begins Wednesday 10 AM in Prabha Bhawan CC-03. Ensure your git repository has clean commits and your semaphore implementations handle race conditions without busy-waiting. Check your allotted viva slots below.',
        category: 'Questions',
        tags: 'CS204,OperatingSystems,Nachos,Viva',
        isPinned: true,
      },
    });

    // 3. Student Post - Questions (Aarav)
    const post1 = await prisma.post.create({
      data: {
        authorId: aarav.id,
        title: 'CS204 Nachos OS: Condition::Wait() deadlock fix and interrupt disabling',
        content: 'For anyone stuck on CS204 Nachos OS Lab 2: If your thread condition variable hangs in Condition::Wait(), remember that interrupt->SetLevel(IntOff) must be paired with re-enabling interrupts before returning. Here is the snippet from my solution:',
        codeSnippet: 'void Condition::Wait(Lock* conditionLock) {\n    ASSERT(conditionLock->isHeldByCurrentThread());\n    IntStatus oldLevel = interrupt->SetLevel(IntOff);\n    conditionLock->Release();\n    waitQueue->Append((void *)currentThread);\n    currentThread->Sleep();\n    conditionLock->Acquire();\n    (void) interrupt->SetLevel(oldLevel);\n}',
        codeLanguage: 'cpp',
        category: 'Questions',
        tags: 'CS204,NachosOS,Synchronization,Threading',
        isPinned: false,
      },
    });

    // Add comments on post1
    const comment1 = await prisma.comment.create({
      data: {
        postId: post1.id,
        authorId: diya.id,
        content: 'This saved me hours! Was wondering why my tests were getting stuck at thread context switch. Does the lock release order strictly require IntOff first?',
      },
    });

    // Reply to comment1
    await prisma.comment.create({
      data: {
        postId: post1.id,
        authorId: aarav.id,
        parentId: comment1.id,
        content: 'Yes Diya! If you release the conditionLock before turning interrupts off, a context switch could happen between release and sleep, leaving the thread orphaned on waitQueue.',
      },
    });

    // 4. Student Post - Projects (Sneha)
    const post2 = await prisma.post.create({
      data: {
        authorId: sneha.id,
        title: 'Building CampusConnect UI System: Tailwind tokens + Material Symbols',
        content: 'Excited to share the design tokens for our campus digital commons! We crafted a dedicated Tailwind palette using MNIT brand indigo, plus dark mode high-contrast cards for late-night hostel coding drills.',
        codeSnippet: '// tailwind.config.js token snippet\ncolors: {\n  primary: "#3525cd",\n  "primary-container": "#4f46e5",\n  "surface-container-lowest": "#ffffff",\n  "on-surface": "#131b2e"\n}',
        codeLanguage: 'javascript',
        category: 'Projects',
        tags: 'WebDev,TailwindCSS,DesignSystem,UIUX',
        isPinned: false,
      },
    });

    await prisma.comment.create({
      data: {
        postId: post2.id,
        authorId: aarav.id,
        content: 'The contrast in CC-03 lab monitors is crisp. Let us hook up the WebSocket live sync next!',
      },
    });

    // 5. Student Post - College Life (Devendra)
    const post3 = await prisma.post.create({
      data: {
        authorId: devendra.id,
        title: 'Post-midsem chai & CP virtual contest upsolving at Hostel 5',
        content: 'Heading down to Prabha Bhawan canteen around 5:30 PM after CC-03 lab session. If anyone wants to discuss the upcoming Sphinx hackathon track ideas or review CS202 graph assignment, pull up!',
        category: 'College Life',
        tags: 'PrabhaBhawan,Hostel5,Chai,CampusLife',
        isPinned: false,
      },
    });

    // 6. Student Post - Opportunities (Kartik)
    const post4 = await prisma.post.create({
      data: {
        authorId: kartik.id,
        title: 'Summer 2026 SWE Internship Referral Guidelines for 2nd & 3rd Years',
        content: 'Hey everyone, I will be collecting resumes for 2026 SWE internships at Google and Microsoft next weekend. Please make sure your resumes highlight systems projects (like Nachos OS or Distributed Raft) and include active GitHub/LeetCode links.',
        category: 'Opportunities',
        tags: 'Placements,Internships,Google,Seniors',
        isPinned: false,
      },
    });

    const comment2 = await prisma.comment.create({
      data: {
        postId: post4.id,
        authorId: devendra.id,
        content: 'Thanks bhaiya! Are DSA rounds heavy on graph DP or tree algorithms for systems roles?',
      },
    });

    await prisma.comment.create({
      data: {
        postId: post4.id,
        authorId: kartik.id,
        parentId: comment2.id,
        content: 'Focus heavily on BFS/DFS state transitions, concurrency primitives, and clean code readability. Edge case handling is what interviewers look for.',
      },
    });
  }

  // Seed sample campus groups
  if (aarav && sneha && devendra && priya && diya && kartik) {
    // 1. Sphinx Hackathon Core
    let sphinxGroup = await prisma.group.findFirst({ where: { name: 'Sphinx Hackathon Core' } });
    if (!sphinxGroup) {
      sphinxGroup = await prisma.group.create({
        data: {
          name: 'Sphinx Hackathon Core',
          description: 'MNIT annual technical fest hackathon planning team. Coordinating problem tracks, server infrastructure, and mentor sessions.',
          category: 'hackathon',
          createdById: aarav.id,
          lastMessageAt: new Date(),
        },
      });
      // Add members
      await prisma.groupMember.createMany({
        data: [
          { groupId: sphinxGroup.id, userId: aarav.id, role: 'admin' },
          { groupId: sphinxGroup.id, userId: sneha.id, role: 'member' },
          { groupId: sphinxGroup.id, userId: devendra.id, role: 'member' },
        ],
      });
      // Add initial messages
      await prisma.groupMessage.createMany({
        data: [
          { groupId: sphinxGroup.id, senderId: sneha.id, content: 'Hey team! I drafted the Tailwind design system tokens for the registration portal.' },
          { groupId: sphinxGroup.id, senderId: aarav.id, content: 'Looks super clean! I will wire up the SQLite database and auth endpoints.' },
          { groupId: sphinxGroup.id, senderId: devendra.id, content: 'Let us test the load balancer before opening registration to all MNIT batches.' },
        ],
      });
    }

    // 2. CS204 OS Lab Group CC-03
    let osGroup = await prisma.group.findFirst({ where: { name: 'CS204 OS Lab Group CC-03' } });
    if (!osGroup) {
      osGroup = await prisma.group.create({
        data: {
          name: 'CS204 OS Lab Group CC-03',
          description: 'Operating Systems lab discussions, Nachos scheduler debugging, and viva review.',
          category: 'academic',
          createdById: aarav.id,
          lastMessageAt: new Date(),
        },
      });
      await prisma.groupMember.createMany({
        data: [
          { groupId: osGroup.id, userId: aarav.id, role: 'admin' },
          { groupId: osGroup.id, userId: priya.id, role: 'member' },
          { groupId: osGroup.id, userId: diya.id, role: 'member' },
        ],
      });
      await prisma.groupMessage.createMany({
        data: [
          { groupId: osGroup.id, senderId: priya.id, content: 'Don\'t forget to push your semaphore implementations before Wednesday 10 AM lab!' },
          { groupId: osGroup.id, senderId: diya.id, content: 'Thanks Priya! The condition variable test cases are passing now.' },
          { groupId: osGroup.id, senderId: aarav.id, content: 'Remember to disable interrupts when manipulating the thread waitQueue.' },
        ],
      });
    }

    // 3. Kaveri Hostel LAN & Chai
    let hostelGroup = await prisma.group.findFirst({ where: { name: 'Kaveri Hostel LAN & Chai' } });
    if (!hostelGroup) {
      hostelGroup = await prisma.group.create({
        data: {
          name: 'Kaveri Hostel LAN & Chai',
          description: 'Hostel 4 residents chat. Late night canteen runs, weekend CS study drills, and evening chai.',
          category: 'hostel',
          createdById: aarav.id,
          lastMessageAt: new Date(),
        },
      });
      await prisma.groupMember.createMany({
        data: [
          { groupId: hostelGroup.id, userId: aarav.id, role: 'admin' },
          { groupId: hostelGroup.id, userId: kartik.id, role: 'member' },
          { groupId: hostelGroup.id, userId: devendra.id, role: 'member' },
        ],
      });
      await prisma.groupMessage.createMany({
        data: [
          { groupId: hostelGroup.id, senderId: kartik.id, content: 'Anyone heading to the canteen for midnight Maggi & chai?' },
          { groupId: hostelGroup.id, senderId: aarav.id, content: 'On my way down from 2nd floor!' },
        ],
      });
    }

    // 4. Distributed Systems & Database Reading Club (with pending invitations)
    let distGroup = await prisma.group.findFirst({ where: { name: 'Distributed Systems Reading Club' } });
    if (!distGroup) {
      distGroup = await prisma.group.create({
        data: {
          name: 'Distributed Systems Reading Club',
          description: 'Weekly paper reviews on Raft, Paxos, Spanner, and Kafka. Building consensus engines from scratch in Go and Rust.',
          category: 'academic',
          createdById: kartik.id,
          lastMessageAt: new Date(),
        },
      });
      // Kartik is admin
      await prisma.groupMember.create({
        data: {
          groupId: distGroup.id,
          userId: kartik.id,
          role: 'admin',
          status: 'accepted',
        },
      });
      // Invite Aarav and Diya as pending
      await prisma.groupMember.createMany({
        data: [
          {
            groupId: distGroup.id,
            userId: aarav.id,
            role: 'member',
            status: 'pending',
            invitedById: kartik.id,
          },
          {
            groupId: distGroup.id,
            userId: diya.id,
            role: 'member',
            status: 'pending',
            invitedById: kartik.id,
          },
        ],
      });
    }

    // Seed Updates & Opportunities
    await prisma.savedItem.deleteMany({});
    await prisma.updateItem.deleteMany({});

    const update1 = await prisma.updateItem.create({
      data: {
        title: 'MNIT Annual Convocation & Final Degree Clearance Procedures',
        description: 'All final year graduating students must complete online no-dues clearance across Central Library, Hostel Offices, and Department Laboratories before degree conferment.',
        category: 'Announcements',
        organizer: 'Academic Section, MNIT Jaipur',
        venue: 'Prabha Bhawan Central Hall',
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        deadlineText: 'Nov 25, 2026 • 5:00 PM',
        linkUrl: 'https://mnit.ac.in/academics/convocation',
        tags: 'Convocation,Graduation,AcademicSection,NoDues',
        isOfficial: true,
        authorId: kartik.id,
      },
    });

    const update2 = await prisma.updateItem.create({
      data: {
        title: 'CS204 Operating Systems Lab 3 Viva Rescheduled for Batch A',
        description: 'Prof. Verma has rescheduled Lab 3 (Nachos Synchronization & Semaphores) for Batch A to Tuesday morning. Ensure git repos are pushed before 9:00 AM.',
        category: 'Academic Updates',
        organizer: 'Dept. of Computer Science & Engineering',
        venue: 'Computer Center 3',
        deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        deadlineText: 'Nov 3, 2026 • 10:00 AM',
        linkUrl: null,
        tags: 'CS204,LabViva,BatchA,Nachos',
        isOfficial: true,
        authorId: aarav.id,
      },
    });

    const update3 = await prisma.updateItem.create({
      data: {
        title: 'Live Mock OA & Graph/DP Strategy for 2nd & 3rd Years',
        description: 'Organized by placed seniors and competitive coders. 90-minute timed mock assessment followed by live code walkthrough of optimal solutions and complexity pitfalls.',
        category: 'Events',
        organizer: 'Devendra Singh (Hostel 5 Peer Circle)',
        venue: 'VLTC Room 302',
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        deadlineText: 'Saturday • 3:00 PM – 5:30 PM',
        linkUrl: null,
        tags: 'MockOA,PlacementPrep,DSA,Hostel5',
        isOfficial: false,
        authorId: devendra.id,
      },
    });

    const update4 = await prisma.updateItem.create({
      data: {
        title: 'Samsung PRISM On-Campus Worklet & Research Internship Call 2026',
        description: 'Open to 2nd and 3rd year CSE undergrads. Real-world R&D problem statements in on-device AI, 5G protocols, and camera computational vision with Samsung engineers.',
        category: 'Opportunities',
        organizer: 'Training & Placement Cell, MNIT',
        venue: 'Online Application Portal',
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        deadlineText: 'Nov 15, 2026 • 11:59 PM',
        linkUrl: 'https://samsungprism.com/apply',
        tags: 'SamsungPRISM,Internship,Research,AI',
        isOfficial: true,
        authorId: kartik.id,
      },
    });

    const update5 = await prisma.updateItem.create({
      data: {
        title: 'Sphinx 2025 Inter-Hostel Hackathon Teammate Callout (ML & Rust Track)',
        description: 'Looking for 2 teammates passionate about systems or local ML models. Building a decentralized mesh resource indexer for Rajasthan IT sprint qualifier.',
        category: 'Opportunities',
        organizer: 'Sneha Agarwal',
        venue: 'Hostel 4 Kaveri Lounge / CC-3',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        deadlineText: 'Friday • 6:00 PM',
        linkUrl: null,
        tags: 'Sphinx2025,Hackathon,Rust,ML',
        isOfficial: false,
        authorId: sneha.id,
      },
    });

    // Seed saved bookmark for Aarav on Samsung PRISM
    await prisma.savedItem.create({
      data: {
        userId: aarav.id,
        updateItemId: update4.id,
      },
    });

    // Seed "Questions students often ask" (Guidance FAQs)
    console.log('Seeding curated Questions students often ask (Guidance FAQs)...');
    const guidanceFaqs = [
      {
        question: 'How should I structure preparation for the CS204 Nachos OS Lab viva without pulling all-nighters?',
        answer: 'Draw the Thread state transition diagram until you can sketch it from memory. Be ready to trace Thread::Yield(), Thread::Sleep(), and understand why disabling interrupts is only valid in uniprocessor kernels. For synchronization, know why Semaphores avoid busy-waiting via ready queues.',
        category: 'Academics & Labs',
        topicTag: 'Nachos OS Lab',
        seniorAuthor: 'Kartik Dave (4th Year CSE)',
      },
      {
        question: 'Which department electives should I choose in 5th and 6th semester for Systems vs AI track?',
        answer: 'For the Systems track, prioritize Advanced Operating Systems, Distributed Systems, and Compiler Design. For Data & AI, take Machine Learning, Deep Learning, and Database Tuning. Before choosing, ask seniors who took the elective last year about lab assignments and project expectations.',
        category: 'Academics & Labs',
        topicTag: 'Course Electives',
        seniorAuthor: 'Kartik Dave (4th Year CSE)',
      },
      {
        question: 'How do I approach MNIT CSE professors for undergraduate research or BTP projects?',
        answer: 'Read at least one recent publication from the professor. When emailing, keep it under 200 words: mention your current year, GPA, specific technical skills (C++, PyTorch, Linux), and what specific problem from their paper caught your attention. Offer to discuss during department office hours.',
        category: 'Academics & Labs',
        topicTag: 'Research & BTP',
        seniorAuthor: 'Ritika Sen (4th Year CSE)',
      },
      {
        question: 'What kind of side projects actually stand out instead of boilerplate tutorial clones?',
        answer: 'Build tools that solve real problems or explore real depth: a custom memory allocator (malloc/free), a raft consensus prototype in Go, an automated timetable clash resolver for MNIT ERP, or a distributed key-value store. Handling real edge cases (concurrency, network drops, data persistence) beats cosmetic UI every time.',
        category: 'Skills & Projects',
        topicTag: 'Systems Projects',
        seniorAuthor: 'Ritika Sen (4th Year CSE)',
      },
      {
        question: 'How can I balance Competitive Programming on Codeforces with course coursework?',
        answer: 'Consistency beats intensity. Set aside 60-90 minutes 4 days a week for focused problem solving rather than doing 8-hour weekend marathons. Work on 2-3 problems near your rating ceiling. If stuck for over 40 minutes, read the editorial, code the solution yourself from scratch, and add the trick to your notes.',
        category: 'Skills & Projects',
        topicTag: 'Competitive Programming',
        seniorAuthor: 'Devendra Singh (3rd Year CSE)',
      },
      {
        question: 'How do I make my first open source contribution or prepare for GSoC?',
        answer: 'Pick tools or CLI utilities you already use. Look for issues labeled "good first issue" or documentation/test coverage gaps. Learn git rebase, commit hygiene, and how to run project unit tests locally. Communicate politely on issue threads before opening a pull request.',
        category: 'Skills & Projects',
        topicTag: 'Open Source & GSoC',
        seniorAuthor: 'Ritika Sen (4th Year CSE)',
      },
      {
        question: 'What is the most effective approach for online assessments (OAs) without getting overwhelmed?',
        answer: 'Categorize your preparation into core archetypes: Sliding Window, Monotonic Stack, Two Pointers, BFS/DFS on grids, and Dynamic Programming on trees. Solve 3-4 standard problems per archetype to build muscle memory instead of grinding hundreds of random questions.',
        category: 'Campus & Career',
        topicTag: 'Competitive Programming',
        seniorAuthor: 'Devendra Singh (3rd Year CSE)',
      },
      {
        question: 'Can 1st and 2nd years team up with seniors for the Sphinx hackathon?',
        answer: 'Absolutely! Senior teams often look for enthusiastic juniors who can build clean frontend interfaces, help with testing, or prepare demo pitches. Reach out early on CampusConnect to connect with seniors building in areas you want to learn.',
        category: 'Campus & Career',
        topicTag: 'Campus Life & Hackathons',
        seniorAuthor: 'Vikram Rathore (3rd Year CSE)',
      },
    ];

    for (const faq of guidanceFaqs) {
      await prisma.guidanceFaq.create({ data: faq });
    }
  }

  console.log('✅ Seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
