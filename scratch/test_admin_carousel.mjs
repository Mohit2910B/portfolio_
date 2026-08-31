async function testAdmin() {
  console.log('Testing Admin Login and Carousel Manager APIs...');
  
  // 1. Admin login
  const loginRes = await fetch('https://mohitbabariya.in/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'mohit2409', password: 'Mohit@2409' }),
  });
  console.log('Login Status:', loginRes.status);
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Set-Cookie received:', Boolean(cookie));

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(cookie ? { 'Cookie': cookie.split(';')[0] } : {}),
  };

  // 2. GET /api/admin/carousel
  const getRes = await fetch('https://mohitbabariya.in/api/admin/carousel', {
    headers: authHeaders,
  });
  console.log('GET /api/admin/carousel status:', getRes.status);
  const getData = await getRes.json();
  console.log('Carousel Items returned:', getData.items?.length);
  console.log('Global Settings returned:', getData.globalSettings?.sectionTitle);

  // 3. PATCH /api/admin/carousel/settings
  const patchRes = await fetch('https://mohitbabariya.in/api/admin/carousel/settings', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      sectionTitle: 'Engage Audiences with Stunning Videos',
      sectionSubtitle: 'Boost your brand with high-impact short videos & cinematic visual storytelling.',
      autoplaySpeed: 5,
    }),
  });
  console.log('PATCH /api/admin/carousel/settings status:', patchRes.status);
  const patchData = await patchRes.json();
  console.log('Updated Section Title:', patchData.globalSettings?.sectionTitle);

  // 4. Test other admin sections (Enquiries, Categories, Services, Skills, etc.)
  const secTests = ['enquiries', 'categories', 'services', 'skills', 'software-tools', 'media'];
  for (const sec of secTests) {
    const r = await fetch(`https://mohitbabariya.in/api/admin/${sec}`, { headers: authHeaders });
    console.log(`GET /api/admin/${sec} status:`, r.status);
  }
}

testAdmin().catch(console.error);
