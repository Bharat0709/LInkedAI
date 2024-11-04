const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const handleInserts = (payload) => {
  console.log('Change received!', payload);
};

module.exports = supabase;

console.log('Supabase Connection Established');

supabase
  .channel('posts')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'PostsCollection' },
    handleInserts
  )
  .subscribe();
