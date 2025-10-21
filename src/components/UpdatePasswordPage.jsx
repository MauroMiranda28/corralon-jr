// src/components/UpdatePasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Importar cliente Supabase
import TextField from './TextField'; // Reutilizar tu componente de campo de texto
import { KeyRound, CheckCircle, X} from 'lucide-react'; // Iconos


export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  // Verificar si hay una sesión de recuperación al cargar
  useEffect(() => {
    // La librería de Supabase detecta automáticamente el token de recuperación
    // en la URL (#access_token=...) y crea una sesión temporal.
    // Si no hay sesión o no es de recuperación, redirige.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
         console.log("No recovery session found, redirecting to home.");
         // Podrías mostrar un mensaje antes de redirigir
         // setMessage("Enlace inválido o expirado.");
         // setTimeout(() => navigate('/'), 3000);
         // Por ahora, simplemente redirige si no hay sesión
          navigate('/');
      } else {
         console.log("Recovery session detected.");
         setMessage('Ingresa tu nueva contraseña.');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);


  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
       setError('La contraseña debe tener al menos 6 caracteres.');
       return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setIsSuccess(true);
      setMessage('¡Contraseña actualizada con éxito! Serás redirigido al inicio.');

      // Opcional: Cerrar sesión después de actualizar para forzar un nuevo login
      // await supabase.auth.signOut();

      // Redirigir al inicio después de unos segundos
      setTimeout(() => {
        navigate('/'); // Redirige a la página principal
      }, 3000);

    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message || 'No se pudo actualizar la contraseña. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold">Establecer Nueva Contraseña</h2>
        </div>

        {isSuccess ? (
           <div className="text-center p-4 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle className="h-6 w-6 mx-auto mb-2"/>
              <p>{message}</p>
           </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <p className="text-sm text-neutral-600">{message}</p>

            <div>
              <label className="block text-sm">
                <div className="mb-1 text-neutral-600">Nueva Contraseña</div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (mín. 6 caracteres)"
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10"
                  minLength={6}
                  required
                  disabled={loading}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm">
                <div className="mb-1 text-neutral-600">Confirmar Nueva Contraseña</div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10"
                  required
                  disabled={loading}
                />
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-neutral-100">
              <button
                  type="button"
                  className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2"
                  onClick={() => navigate('/')} // Botón para ir al inicio
                  disabled={loading}
                >
                  <X className="h-4 w-4" /> Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 flex items-center gap-2 disabled:opacity-50"
                disabled={loading || !password || !confirmPassword}
              >
                <KeyRound className="h-4 w-4" /> {loading ? "Actualizando..." : "Actualizar Contraseña"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}