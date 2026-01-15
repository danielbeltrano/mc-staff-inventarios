import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import useScreenSize from '../../../hooks/useScreenSize';

/**
 * Componente de paginación que permite navegar entre páginas de contenido
 * @param {Object} props
 * @param {number} props.totalPages - Número total de páginas
 * @param {number} props.currentPage - Página actual
 * @param {Function} props.onPageChange - Función llamada cuando cambia la página
 * @param {string} props.className - Clases adicionales para el contenedor
 * @param {number} props.siblingsCount - Número de páginas adyacentes a mostrar (por defecto 1)
 * @param {boolean} props.showFirstLast - Mostrar botones de primera/última página (por defecto true)
 */
const Pagination = ({
  totalPages,
  currentPage,
  onPageChange,
  className = '',
  siblingsCount = 1,
  showFirstLast = true,
}) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 640;

  // Si no hay páginas, no mostrar nada
  if (totalPages <= 0) return null;

  // Ajustar para mobile
  const effectiveSiblingsCount = isMobile ? 0 : siblingsCount;

  // Generar array de páginas a mostrar
  const generatePaginationItems = () => {
    // Si hay pocas páginas, mostrar todas
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Calcular rangos
    const leftSiblingIndex = Math.max(currentPage - effectiveSiblingsCount, 1);
    const rightSiblingIndex = Math.min(
      currentPage + effectiveSiblingsCount,
      totalPages
    );

    // Determinar si mostrar puntos suspensivos
    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;

    // Caso especial: mostrar primeras páginas
    if (showLeftDots && !showRightDots) {
      const rightItemCount = 3 + 2 * effectiveSiblingsCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return showFirstLast
        ? [1, 'dots', ...rightRange]
        : [...rightRange];
    }

    // Caso especial: mostrar últimas páginas
    if (!showLeftDots && showRightDots) {
      const leftItemCount = 3 + 2 * effectiveSiblingsCount;
      const leftRange = Array.from(
        { length: leftItemCount },
        (_, i) => i + 1
      );
      return showFirstLast
        ? [...leftRange, 'dots', totalPages]
        : [...leftRange];
    }

    // Caso en medio: mostrar páginas del centro con dots en ambos lados
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    
    return showFirstLast
      ? [1, showLeftDots ? 'dots' : 2, ...middleRange, showRightDots ? 'dots' : totalPages - 1, totalPages]
      : [showLeftDots ? 'dots' : 1, ...middleRange, showRightDots ? 'dots' : totalPages];
  };

  // Obtener array de páginas a mostrar
  const paginationItems = generatePaginationItems();

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {/* Botón de página anterior */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`
          p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
          ${currentPage === 1 
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-default hover:bg-amber-100'
          }
        `}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Números de página */}
      {paginationItems.map((page, index) => {
        if (page === 'dots') {
          return (
            <span
              key={`dots-${index}`}
              className="px-2 py-1 text-gray-500"
            >
              <MoreHorizontal size={16} />
            </span>
          );
        }

        const isActive = page === currentPage;

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              min-w-[32px] h-8 px-2 rounded-md text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isActive 
                ? 'bg-blue-default text-white' 
                : 'text-neutral-text hover:bg-amber-200 hover:text-blue-default'
              }
            `}
            aria-label={`Página ${page}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* Botón de página siguiente */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`
          p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
          ${currentPage === totalPages 
            ? 'text-neutral-text cursor-not-allowed'
            : 'text-blue-default hover:bg-amber-100'
          }
        `}
        aria-label="Página siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;