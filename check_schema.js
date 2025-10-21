import { supabase } from './src/config/supabaseClient.js';

async function checkMembersTable() {
  try {
    // Try to get the table structure
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .limit(1);

    if (error) {
      console.log('Error accessing members table:', error);
      return;
    }

    console.log('Successfully accessed members table');
    console.log('Sample data:', data);
  } catch (err) {
    console.log('Unexpected error:', err);
  }
}

checkMembersTable();