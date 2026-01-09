// Script to explore Supabase database structure
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dohrkonencbwvvmklzuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaHJrb25lbmNid3Z2bWtsenVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTAwNTUsImV4cCI6MjA4MzI2NjA1NX0.k2N-H_p-a4FHaOvq7V4u_uXkx45XIY-LZt0RoIJpjmU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreTables() {
  console.log('🔍 Exploring Supabase Database...\n');
  console.log('URL:', supabaseUrl);
  console.log('-----------------------------------\n');

  // Common table names to check
  const possibleTables = [
    // Clarity tables
    'clarity_sessions',
    'clarity_recordings', 
    'clarity_heatmaps',
    'clarity_data',
    'clarity_events',
    'clarity_clicks',
    'clarity_scroll_data',
    'clarity_rage_clicks',
    'clarity_dead_clicks',
    // Crazy Egg tables
    'crazy_egg_sessions',
    'crazy_egg_heatmaps',
    'crazy_egg_data',
    'crazy_egg_clicks',
    'crazy_egg_scrolls',
    // Generic analytics tables
    'sessions',
    'recordings',
    'heatmaps',
    'events',
    'pageviews',
    'clicks',
    'scrolls',
    'conversions',
    'funnels',
    'funnel_steps',
    'users',
    'visitors',
    'analytics',
    'metrics',
    'pages',
    'goals',
    'ab_tests',
    // Other potential tables
    'cro_data',
    'website_data',
    'tracking_data',
  ];

  const foundTables = [];

  for (const tableName of possibleTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: false })
        .limit(3);

      if (!error && data !== null) {
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        foundTables.push({
          name: tableName,
          rowCount: count,
          columns,
          sampleData: data,
        });
        
        console.log(`✅ Found table: ${tableName}`);
        console.log(`   Rows: ${count}`);
        console.log(`   Columns: ${columns.join(', ')}`);
        console.log(`   Sample data:`, JSON.stringify(data[0], null, 2).substring(0, 500));
        console.log('');
      }
    } catch (err) {
      // Table doesn't exist, skip silently
    }
  }

  console.log('-----------------------------------');
  console.log(`\n📊 Summary: Found ${foundTables.length} tables\n`);
  
  if (foundTables.length === 0) {
    console.log('❌ No tables found. Please check:');
    console.log('   1. The Supabase URL and key are correct');
    console.log('   2. Tables exist in the database');
    console.log('   3. RLS policies allow read access');
  } else {
    console.log('Tables found:');
    foundTables.forEach(t => {
      console.log(`  - ${t.name} (${t.rowCount} rows)`);
    });
  }

  // Output JSON for further processing
  console.log('\n📝 JSON Output:');
  console.log(JSON.stringify({ tables: foundTables }, null, 2));
}

exploreTables().catch(console.error);
