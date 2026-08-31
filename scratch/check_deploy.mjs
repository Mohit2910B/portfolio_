async function checkLive() {
  console.log('Testing live website...');
  const siteRes = await fetch('https://mohitbabariya.in/api/site');
  console.log('/api/site status:', siteRes.status);
  const siteData = await siteRes.json();
  console.log('Carousel Global Title:', siteData?.data?.carouselGlobalSettings?.sectionTitle);
  console.log('Carousel Items Count:', siteData?.data?.carouselItems?.length);
  if (siteData?.data?.carouselItems?.length > 0) {
    console.log('First 3 items:', siteData.data.carouselItems.slice(0, 3).map(i => `${i.title} (${i.category})`));
  }

  const pageRes = await fetch('https://mohitbabariya.in');
  const pageHtml = await pageRes.text();
  console.log('Homepage status:', pageRes.status);
  console.log('Contains "PanoramicVideoCarousel" or video showcase:', pageHtml.includes('Video Showcase') || pageHtml.includes('Engage Audiences with Stunning Videos'));
}

checkLive().catch(console.error);
