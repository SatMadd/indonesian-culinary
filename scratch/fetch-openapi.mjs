const url = 'https://cjfpqikdjejtklihaeen.supabase.co/rest/v1/';
const key = 'sb_publishable_u8KofljuRCHc9Hpqi4yCJg_peMohvOa';

async function fetchSchema() {
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error fetching schema:', err);
  }
}

fetchSchema();
