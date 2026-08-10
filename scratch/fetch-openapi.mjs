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
    console.log('Status:', res.status);
    const data = await res.json();
    
    const tablesOfInterest = ['recipes_db', 'profiles', 'recipe_change_requests', 'recipes_archive'];
    
    console.log('--- Definitions of tables ---');
    if (data.definitions) {
      for (const table of tablesOfInterest) {
        if (data.definitions[table]) {
          console.log(`\nTable: ${table}`);
          const props = data.definitions[table].properties || {};
          console.log('Columns:', Object.keys(props).map(k => `${k} (${props[k].type})`));
        } else {
          console.log(`\nTable: ${table} NOT FOUND in OpenAPI definitions`);
        }
      }
    } else {
      console.log('No definitions in response');
    }
  } catch (err) {
    console.error('Error fetching schema:', err);
  }
}

fetchSchema();
