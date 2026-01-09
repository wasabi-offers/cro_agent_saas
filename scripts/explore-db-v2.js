// Script to explore Supabase database structure - Version 2
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dohrkonencbwvvmklzuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaHJrb25lbmNid3Z2bWtsenVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTAwNTUsImV4cCI6MjA4MzI2NjA1NX0.k2N-H_p-a4FHaOvq7V4u_uXkx45XIY-LZt0RoIJpjmU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreTables() {
  console.log('🔍 Exploring Supabase Database (v2)...\n');
  console.log('URL:', supabaseUrl);
  console.log('-----------------------------------\n');

  // Try to get tables from information schema using RPC
  try {
    // First, let's try a direct RPC call if available
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_tables');
    if (!rpcError && rpcData) {
      console.log('RPC tables:', rpcData);
    }
  } catch (e) {
    console.log('RPC not available');
  }

  // Extended list of possible table names including Italian variations
  const possibleTables = [
    // English names
    'sessions', 'session', 'recordings', 'recording', 'heatmaps', 'heatmap',
    'events', 'event', 'pageviews', 'pageview', 'page_views', 'page_view',
    'clicks', 'click', 'scrolls', 'scroll', 'conversions', 'conversion',
    'funnels', 'funnel', 'users', 'user', 'visitors', 'visitor',
    'analytics', 'analytic', 'metrics', 'metric', 'pages', 'page',
    'goals', 'goal', 'ab_tests', 'ab_test', 'tests', 'test',
    // Clarity specific
    'clarity', 'clarity_sessions', 'clarity_data', 'clarity_recordings',
    'clarity_heatmaps', 'clarity_events', 'clarity_clicks', 'clarity_scroll',
    'ms_clarity', 'microsoft_clarity',
    // Crazy Egg specific  
    'crazy_egg', 'crazyegg', 'crazy_egg_data', 'crazy_egg_sessions',
    'crazy_egg_heatmaps', 'crazy_egg_clicks',
    // CRO related
    'cro', 'cro_data', 'cro_metrics', 'cro_sessions',
    // Website/tracking
    'website', 'website_data', 'tracking', 'tracking_data',
    'site_data', 'site_analytics',
    // Raw data
    'raw_data', 'data', 'imports', 'import',
    // From previous project (emails)
    'emails', 'email', 'my_products_briefs',
    // Other common
    'profiles', 'accounts', 'projects', 'websites',
  ];

  const foundTables = [];

  for (const tableName of possibleTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: false })
        .limit(2);

      if (!error && data !== null) {
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        foundTables.push({
          name: tableName,
          rowCount: count,
          columns,
          sampleData: data,
        });
        
        console.log(`✅ Found: ${tableName} (${count} rows)`);
        console.log(`   Columns: ${columns.slice(0, 10).join(', ')}${columns.length > 10 ? '...' : ''}`);
        if (data[0]) {
          const sample = JSON.stringify(data[0], null, 2);
          console.log(`   Sample: ${sample.substring(0, 300)}${sample.length > 300 ? '...' : ''}`);
        }
        console.log('');
      }
    } catch (err) {
      // Skip
    }
  }

  console.log('-----------------------------------');
  console.log(`\n📊 Found ${foundTables.length} tables\n`);
  
  if (foundTables.length > 0) {
    // Save full output
    const fs = require('fs');
    fs.writeFileSync(
      'database-structure.json',
      JSON.stringify({ 
        url: supabaseUrl,
        tables: foundTables,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
    console.log('📝 Full structure saved to database-structure.json');
  }
}

exploreTables().catch(console.error);
