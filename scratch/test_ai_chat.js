async function test() {
  const startRes = await fetch('https://mohitbabariya.in/api/chat/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohit Sharma',
      email: 'rohit@test.com',
      countryCode: '+91',
      phone: '9876500000',
    }),
  });

  const cookie = startRes.headers
    .getSetCookie()
    .find((c) => c.startsWith('mb_chat='))
    .split(';')[0];

  console.log('Chat Session Cookie:', cookie);

  // 1. Creative Query
  console.log('\n--- 1. Creative Query: Instagram Reels & Turnaround ---');
  const postRes1 = await fetch('https://mohitbabariya.in/api/chat/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      message: 'Do you edit vertical Instagram reels and what is the turnaround time?',
    }),
  });
  console.log('Post 1 Status:', postRes1.status, await postRes1.text());

  let res = await fetch('https://mohitbabariya.in/api/chat/messages', {
    headers: { Cookie: cookie },
  });
  let data = await res.json();
  console.log('GET 1 Status:', res.status, JSON.stringify(data, null, 2));

  // 2. Off-Topic Query
  console.log('\n--- 2. Off-Topic Query: Python Coding & Homework ---');
  await fetch('https://mohitbabariya.in/api/chat/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      message: 'Can you write me a python script to solve a calculus math problem?',
    }),
  });

  res = await fetch('https://mohitbabariya.in/api/chat/messages', {
    headers: { Cookie: cookie },
  });
  data = await res.json();
  for (const m of (data.messages || []).slice(-2)) {
    console.log(`[${m.senderType}]: ${m.message}`);
  }
}

test().catch(console.error);
