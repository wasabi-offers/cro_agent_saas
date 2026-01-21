// Query to check if we have real tracking data
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('Checking for real tracking data...');
  
  const { data, error } = await supabase
    .from('tracking_events')
    .select('event_type, funnel_id, click_x, click_y')
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total events found:', data?.length || 0);
  console.log('Sample events:', data);
}

checkData();
