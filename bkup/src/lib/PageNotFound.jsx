import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    // Redirect Google Translate variants of /register
    useEffect(() => {
        const path = location.pathname.toLowerCase();
        if (path.includes('registrar') || path.includes('register')) {
            // Preserve query string but fix ref__ -> ref
            const params = new URLSearchParams(location.search);
            const ref = params.get('ref') || params.get('ref__') || params.get('ref_');
            const dest = ref ? `/register?ref=${ref}` : '/register';
            window.location.replace(dest);
        }
    }, [location]);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full text-center space-y-6">
                <h1 className="text-7xl font-light text-muted-foreground/30">404</h1>
                <div className="h-0.5 w-16 bg-border mx-auto"></div>
                <h2 className="text-2xl font-medium text-foreground">Página não encontrada</h2>
                <p className="text-muted-foreground">A página "{pageName}" não existe.</p>
                <button 
                    onClick={() => window.location.href = '/'} 
                    className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gold hover:bg-gold-hover text-primary-foreground rounded-lg transition-colors"
                >
                    Voltar ao Início
                </button>
            </div>
        </div>
    )
}