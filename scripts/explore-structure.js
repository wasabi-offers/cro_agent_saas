// Script to explore full database structure
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dohrkonencbwvvmklzuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaHJrb25lbmNid3Z2bWtsenVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTAwNTUsImV4cCI6MjA4MzI2NjA1NX0.k2N-H_p-a4FHaOvq7V4u_uXkx45XIY-LZt0RoIJpjmU';

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'clarity_insights',
  'clarity_traffic_by_device',
  'clarity_engagement_by_device', 
  'clarity_ux_issues',
  'clarity_daily_summary',
  'crazyegg_snapshots',
  'crazyegg_snapshots_history',
  'crazyegg_active_snapshots',
  'crazyegg_snapshots_by_url',
];

async function exploreStructure() {
  console.log('🔍 Exploring Database Structure...\n');
  
  const result = {};

  for (const tableName of tables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(3);

      if (!error && data !== null) {
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        result[tableName] = {
          rowCount: count,
          columns,
          sampleData: data,
        };
        
        console.log(`\n✅ ${tableName}`);
        console.log(`   Rows: ${count}`);
        console.log(`   Columns (${columns.length}): ${columns.join(', ')}`);
        if (data[0]) {
          console.log(`   Sample:`);
          console.log(JSON.stringify(data[0], null, 2));
        }
      } else if (error) {
        console.log(`\n❌ ${tableName}: ${error.message}`);
      }
    } catch (err) {
      console.log(`\n❌ ${tableName}: ${err.message}`);
    }
  }

  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    'database-structure.json',
    JSON.stringify(result, null, 2)
  );
  console.log('\n\n📝 Full structure saved to database-structure.json');
}

exploreStructure().catch(console.error);
