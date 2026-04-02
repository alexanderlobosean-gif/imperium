// Script para debug das variáveis de ambiente
// Execute no console do navegador para verificar o que está sendo carregado

console.log('=== DEBUG VARIÁVEIS DE AMBIENTE ===');

// Verificar import.meta.env
console.log('import.meta.env.VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('import.meta.env.VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY:', import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

// Verificar se as chaves são válidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseAnonKey) {
    console.log('✅ Variáveis carregadas com sucesso');
    console.log('URL:', supabaseUrl);
    console.log('Anon Key length:', supabaseAnonKey.length);
    
    // Testar se a chave parece válida
    if (supabaseAnonKey.startsWith('eyJ')) {
        console.log('✅ Anon Key parece ser JWT válido');
    } else {
        console.log('❌ Anon Key não parece ser JWT válido');
    }
} else {
    console.log('❌ Variáveis não carregadas');
    console.log('URL:', supabaseUrl);
    console.log('Anon Key:', supabaseAnonKey);
}

console.log('=== FIM DEBUG ===');
