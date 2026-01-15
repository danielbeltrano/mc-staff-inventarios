import React, { useEffect, useState, useCallback, memo } from 'react';
import { supabaseStudentClient } from '../../core/config/supabase/supabaseCampusStudentClient';
import { User } from 'lucide-react';

// Caché en memoria para URLs
const urlCache = new Map();
const CACHE_DURATION = 55 * 60 * 1000; // 55 minutos en milisegundos

// Componente de Avatar por defecto
const DefaultAvatar = memo(() => (
  <div className="w-full h-full flex items-center justify-center">
    <User />
  </div>
));

DefaultAvatar.displayName = 'DefaultAvatar';

// Componente de fallback
const PhotoFallback = memo(() => (
  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
    <User className="w-8 h-8 text-neutral-400" />
  </div>
));

PhotoFallback.displayName = 'PhotoFallback';

// Componente de loading
const LoadingSpinner = memo(() => (
  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-blue-default border-t-transparent rounded-full animate-spin" />
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Componente de imagen con manejo de errores
const StudentImage = memo(({ src, onError }) => {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  if (hasError) {
    return <DefaultAvatar />;
  }

  return (
    <img
      src={src}
      alt="Foto del estudiante"
      className="w-full h-full object-cover"
      loading="lazy"
      onError={handleError}
    />
  );
});

StudentImage.displayName = 'StudentImage';

const StudentPhoto = memo(({ codigoEstudiante }) => {
  const [photoUrl, setPhotoUrl] = useState(() => {
    const cached = urlCache.get(codigoEstudiante);
    return cached?.url && Date.now() - cached.timestamp < CACHE_DURATION ? cached.url : null;
  });
  const [loading, setLoading] = useState(!photoUrl);

  const createSignedUrl = useCallback(async (extension) => {
    const filePath = `${codigoEstudiante}/foto_perfil/perfil_${codigoEstudiante}.${extension}`;
    return supabaseStudentClient
      .storage
      .from('documentos_estudiantes')
      .createSignedUrl(filePath, 3600);
  }, [codigoEstudiante]);

  const fetchPhoto = useCallback(async () => {
    if (!codigoEstudiante) {
      setLoading(false);
      return;
    }

    // Verificar caché
    const cached = urlCache.get(codigoEstudiante);
    if (cached?.url && Date.now() - cached.timestamp < CACHE_DURATION) {
      setPhotoUrl(cached.url);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Intentar primero JPG, que suele ser el más común
      let response = await createSignedUrl('jpg');
      
      if (!response.data?.signedUrl) {
        // Si no hay jpg, intentar otros formatos en paralelo
        const otherExtensions = ['jpeg', 'png'];
        const responses = await Promise.all(
          otherExtensions.map(ext => createSignedUrl(ext))
        );
        
        response = responses.find(r => r.data?.signedUrl) || response;
      }

      if (response.data?.signedUrl) {
        // Guardar en caché
        urlCache.set(codigoEstudiante, {
          url: response.data.signedUrl,
          timestamp: Date.now()
        });
        setPhotoUrl(response.data.signedUrl);
      }
    } catch (error) {
      console.error('Error al cargar la foto:', error);
      setPhotoUrl(null);
    } finally {
      setLoading(false);
    }
  }, [codigoEstudiante, createSignedUrl]);

  useEffect(() => {
    fetchPhoto();

    // Limpieza de caché antigua
    const now = Date.now();
    urlCache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_DURATION) {
        urlCache.delete(key);
      }
    });
  }, [fetchPhoto]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!photoUrl) {
    return <PhotoFallback />;
  }

  return (
    <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-100">
      <StudentImage 
        src={photoUrl}
        onError={() => setPhotoUrl(null)}
      />
    </div>
  );
});

StudentPhoto.displayName = 'StudentPhoto';

export default StudentPhoto;