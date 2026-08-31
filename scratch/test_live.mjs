async function verify() {
  const res = await fetch('https://mohitbabariya.in');
  const html = await res.text();
  console.log('Homepage status:', res.status);
  console.log('Contains id="work":', html.includes('id="work"'));
  console.log('Contains "Featured Showcase":', html.includes('Featured Showcase'));
  console.log('Contains "Selected Works":', html.includes('Selected Works') || html.includes('Selected Visual Works'));
}
verify().catch(console.error);
