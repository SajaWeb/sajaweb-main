// src/app/dashboard/page.tsx

'use client';

import { useSession} from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const DashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // No hacer nada mientras se carga
    if (!session) router.push('/login'); // Redirigir si no está autenticado
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Cargando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl mb-4">Panel de administración</h1>
      <p>Bienvenido(a)  , {session?.user?.name}</p>
      <p>Tu rol es: {session?.user?.role}</p>
    </div>
  );
};

export default DashboardPage;
