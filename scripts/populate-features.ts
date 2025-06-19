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

async function populateFeatures() {
  // Initialize Supabase client
  const supabase = createClient(
    'https://vvnqijcqpaolehwggtls.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bnFpamNxcGFvbGVod2dndGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDQ5MjMsImV4cCI6MjA2NDMyMDkyM30.IIZZxPTZ034IF5UyyuCd9xZXRR1JdGZ3wbAM35EV_3M'
  );

  try {
    // Fetch all features from D&D API
    const data = await fetchWithRetry('https://www.dnd5eapi.co/api/features');
    console.log(`Found ${data.results.length} features to fetch`);

    const features = [];
    
    // Fetch feature details sequentially with delay
    for (const feature of data.results) {
      try {
        await delay(100); // Add 100ms delay between requests
        const featureData = await fetchWithRetry(`https://www.dnd5eapi.co${feature.url}`);
        console.log(`Fetched feature: ${feature.index}`);
        
        // Transform the data to match our schema
        const transformedFeature = {
          index: featureData.index,
          name: featureData.name,
          class_index: featureData.class?.index || null,
          class_name: featureData.class?.name || null,
          level: featureData.level || 1,
          prerequisites: featureData.prerequisites || [],
          description: featureData.desc || [],
          url: featureData.url,
          api_updated_at: featureData.updated_at ? new Date(featureData.updated_at).toISOString() : null,
          created_at: new Date().toISOString()
        };
        
        features.push(transformedFeature);
      } catch (error) {
        console.error(`Error fetching feature ${feature.index}:`, error);
      }
    }

    // Insert features into Supabase in batches
    const batchSize = 50;
    for (let i = 0; i < features.length; i += batchSize) {
      const batch = features.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('features')
        .upsert(batch, { onConflict: 'index' });

      if (error) {
        console.error('Error inserting batch:', error);
      } else {
        console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} features)`);
      }
    }

    console.log(`Finished populating features table with ${features.length} features`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
populateFeatures(); 