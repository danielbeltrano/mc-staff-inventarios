import React, { useEffect, useState } from 'react';
import { Shield, Eye, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Cards';

const BlobPDFViewer = ({ 
  fileUrl, 
  nombreArchivo = "Documento confidencial",
  isMobile = false 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [iframeKey, setIframeKey] = useState(0);

  // Protecciones de seguridad
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const handleSelectStart = (e) => {
      e.preventDefault();
      return false;
    };

    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        alert('⚠️ Documento protegido: La impresión está deshabilitada por seguridad.');
        return false;
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        alert('⚠️ Documento protegido: La descarga está deshabilitada por seguridad.');
        return false;
      }
      if (e.key === 'F12') {
        alert('⚠️ Este documento contiene información confidencial.');
      }
      // Navegación con teclado en móviles
      if (isMobile) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          goToPrevPage();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          goToNextPage();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.warn('Posible intento de captura detectado');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Navegación de páginas para móviles
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setIframeKey(prev => prev + 1); // Fuerza re-render del iframe
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setIframeKey(prev => prev + 1); // Fuerza re-render del iframe
    }
  };

  const goToPage = (page) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      setIframeKey(prev => prev + 1);
    }
  };

  // Detectar número total de páginas (estimación básica)
  const detectTotalPages = async (blob) => {
    try {
      // Leer los primeros bytes para buscar el conteo de páginas
      const text = await blob.slice(0, 2000).text();
      const match = text.match(/\/Count\s+(\d+)/);
      if (match) {
        const pages = parseInt(match[1]);
        setTotalPages(pages);
        console.log(`📄 Detectadas ${pages} páginas en el PDF`);
      } else {
        // Fallback: asumir múltiples páginas
        setTotalPages(10);
        console.log('📄 No se pudo detectar páginas, asumiendo 10');
      }
    } catch (error) {
      console.warn('⚠️ Error detectando páginas:', error);
      setTotalPages(10); // Fallback
    }
  };

  // Cargar PDF como blob para evitar problemas de COEP
  useEffect(() => {
    const loadPDFAsBlob = async () => {
      if (!fileUrl) return;

      try {
        setLoading(true);
        console.log('🔄 Cargando PDF como blob desde:', fileUrl);

        // Fetch el PDF como blob
        const response = await fetch(fileUrl, {
          method: 'GET',
          // No incluir credentials para evitar problemas CORS
          credentials: 'omit',
          headers: {
            'Accept': 'application/pdf,*/*',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        
        // Verificar que es un PDF
        if (!blob.type.includes('pdf') && !blob.type.includes('octet-stream')) {
          throw new Error('El archivo no es un PDF válido');
        }

        // Crear URL blob local
        const localBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(localBlobUrl);
        
        // Detectar páginas si es móvil
        if (isMobile) {
          await detectTotalPages(blob);
        }
        
        setLoading(false);
        setError(null);

        console.log('✅ PDF cargado como blob exitosamente');

      } catch (err) {
        console.error('❌ Error al cargar PDF como blob:', err);
        setError(`Error al cargar el documento: ${err.message}`);
        setLoading(false);
      }
    };

    loadPDFAsBlob();

    // Cleanup: revocar blob URL cuando el componente se desmonte
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [fileUrl, isMobile]);

  // Cleanup blob URL cuando cambie
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-default"></div>
        <p className="mt-4 text-gray-600">Cargando documento seguro...</p>
        <p className="text-xs text-gray-500 mt-2">Procesando archivo PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <AlertTriangle size={48} className="mb-4" />
        <p className="text-center font-medium">Error al cargar el documento</p>
        <p className="text-center text-sm mt-2">{error}</p>
        <p className="text-center text-xs mt-4 text-gray-500">
          Verifica tu conexión e intenta nuevamente
        </p>
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <AlertTriangle size={48} className="mb-4" />
        <p className="text-center">No se pudo generar la vista del documento</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Barra de advertencia de seguridad */}
      <div className="flex items-center justify-between bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-red-600" />
          <span className="text-sm font-medium text-red-800">
            📋 Documento confidencial - Solo visualización
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-red-600">
          <Eye size={12} />
          <span>Protegido</span>
        </div>
      </div>

      {/* Controles de paginación para móviles */}
      {isMobile && totalPages > 1 && (
        <Card className="p-3 mb-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              variant="amber"
              className="p-2 flex items-center gap-1 rounded-md"
            >
              Anterior
            </Button>
            
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-12 text-center text-sm border rounded px-1 py-0.5"
              />
              <span className="text-sm text-gray-600">de {totalPages}</span>
            </div>
            
            <Button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              variant="amber"
              className="p-2 flex items-center gap-1 rounded-md"
            >
              Siguiente
            </Button>
          </div>
        </Card>
      )}

      {/* Contenedor del documento con protecciones */}
      <div 
        className={`relative  overflow-hidden bg-gray-100 ${isMobile ? "border-x rounded-x-md" : "border rounded-md "}`}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <iframe
          key={iframeKey} // Fuerza re-render cuando cambia la página
          src={isMobile && totalPages > 1 
            ? `${blobUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-width`
            : `${blobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`
          }
          title="Documento confidencial"
          className="w-full border-0"
          style={{
            height: isMobile ? '500px' : '700px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          frameBorder="0"
          allowFullScreen
          loading="lazy"
        />
      </div>

      {/* Controles de paginación inferiores para móviles */}
      {isMobile && totalPages > 1 && (
        <div className="flex items-center justify-center bg-gray-50 p-2 rounded-b border border-t-0 gap-4">
          <Button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            variant="rounded"
            className="p-2"
            title="Página anterior"
          >
            <ChevronLeft size={18} />
          </Button>
          
          <span className="text-xs text-gray-600 min-w-[60px] text-center">
            {currentPage} / {totalPages}
          </span>
          
          <Button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            variant="rounded"
            className="p-2"
            title="Página siguiente"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      )}

      {/* Mensaje de advertencia para móviles */}
      {isMobile && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <Shield size={16} className="text-amber-600 mt-0.5" />
            <div className="text-xs text-amber-700">
              <p className="font-medium mb-1">📱 Navegación optimizada</p>
              <p>
                • Usa las <strong>flechas arriba y abajo</strong> para cambiar páginas<br/>
                • <strong>Flechas del teclado</strong> también funcionan<br/>
                • <strong>No es posible</strong> descargar, imprimir o capturar<br/>
                • El contenido es <strong>confidencial</strong> y está protegido
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información del archivo */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          📄 • {isMobile && totalPages > 1 ? `${totalPages} páginas` : 'Documento protegido'}
        </p>
      </div>
    </div>
  );
};

export default BlobPDFViewer;