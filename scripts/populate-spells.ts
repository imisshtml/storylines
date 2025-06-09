const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with retry logic
const fetchWithRetry = async (url: string, retries = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
};

async function populateSpells() {
  // Initialize Supabase client
  const supabase = createClient(
    'https://vvnqijcqpaolehwggtls.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bnFpamNxcGFvbGVod2dndGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDQ5MjMsImV4cCI6MjA2NDMyMDkyM30.IIZZxPTZ034IF5UyyuCd9xZXRR1JdGZ3wbAM35EV_3M'
  );

  try {
    // Fetch all spells from D&D API
    const data = await fetchWithRetry('https://www.dnd5eapi.co/api/spells');
    console.log(`Found ${data.results.length} spells to fetch`);

    const spells = [];
    
    // Fetch spell details sequentially with delay
    for (const spell of data.results) {
      try {
        await delay(100); // Add 100ms delay between requests
        const spellData = await fetchWithRetry(`https://www.dnd5eapi.co${spell.url}`);
        console.log(`Fetched spell: ${spell.index}`);
        
        // Transform the data to match our schema
        const transformedSpell = {
          index: spellData.index,
          name: spellData.name,
          level: spellData.level,
          school: spellData.school.name,
          casting_time: spellData.casting_time,
          range: spellData.range,
          components: spellData.components,
          duration: spellData.duration,
          description: spellData.desc,
          higher_level: spellData.higher_level || null,
          material: spellData.material || null,
          ritual: spellData.ritual || false,
          concentration: spellData.concentration || false,
          classes: spellData.classes.map((c: any) => c.name),
          created_at: new Date().toISOString()
        };
        
        spells.push(transformedSpell);
      } catch (error) {
        console.error(`Error fetching spell ${spell.index}:`, error);
      }
    }

    // Insert spells into Supabase in batches
    const batchSize = 50;
    for (let i = 0; i < spells.length; i += batchSize) {
      const batch = spells.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('spells')
        .upsert(batch, { onConflict: 'index' });

      if (error) {
        console.error('Error inserting batch:', error);
      } else {
        console.log(`Inserted batch ${i / batchSize + 1}`);
      }
    }

    console.log('Finished populating spells table');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
populateSpells(); 