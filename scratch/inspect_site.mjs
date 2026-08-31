async function test() {
  const res = await fetch('https://mohitbabariya.in/api/site');
  const json = await res.json();
  console.log('Keys in /api/site json:', Object.keys(json));
  console.log('carouselGlobalSettings:', json.carouselGlobalSettings || json.data?.carouselGlobalSettings);
  console.log('carouselItems count:', (json.carouselItems || json.data?.carouselItems)?.length);
  const items = json.carouselItems || json.data?.carouselItems || [];
  for (const item of items) {
    console.log(`- [${item.id}] ${item.title} (${item.category}): ${item.videoUrl ? 'Has Video' : 'No Video'}, ${item.thumbnailUrl ? 'Has Poster' : 'No Poster'}`);
  }
}
test().catch(console.error);
