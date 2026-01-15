// src/components/ui/UniversalTable/UniversalTable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import useScreenSize from '../../../hooks/useScreenSize';
import TableView from './TableView';
import CardsView from './CardsView';
import LoadingSpinner from '../../LoadingSpinner';

/**
 * Componente universal de tabla/lista responsive
 * Cambia automáticamente entre vista tabla (desktop) y cards (mobile)
 * 
 * @component
 * @example
 * const columns = [
 *   { key: 'codigo', label: 'Código', type: 'text' },
 *   { key: 'photo', label: 'Foto', type: 'photo', photoField: 'codigo_estudiante' },
 *   { key: 'nombre', label: 'Nombre', type: 'text' },
 *   { 
 *     key: 'estado', 
 *     label: 'Estado', 
 *     type: 'badge',
 *     getBadgeProps: (value) => ({
 *       variant: value === 'activo' ? 'success' : 'error',
 *       text: value
 *     })
 *   },
 *   { 
 *     key: 'acciones', 
 *     label: 'Acciones', 
 *     type: 'actions',
 *     actions: [
 *       {
 *         label: 'Ver',
 *         icon: Eye,
 *         onClick: (row) => console.log(row),
 *         variant: 'primary'
 *       }
 *     ]
 *   }
 * ];
 * 
 * <UniversalTable
 *   data={estudiantes}
 *   columns={columns}
 *   loading={false}
 *   emptyMessage="No hay datos disponibles"
 *   onRowClick={(row) => console.log(row)}
 * />
 */
const UniversalTable = ({
  data = [],
  columns = [],
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  onRowClick = null,
  className = '',
  breakpoint = 768,
  showIndex = false,
  indexLabel = '#',
  striped = false,
  hoverable = true,
}) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= breakpoint;

  // Validación de datos
  if (!Array.isArray(data)) {
    console.error('UniversalTable: data debe ser un array');
    return null;
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    console.error('UniversalTable: columns debe ser un array con al menos un elemento');
    return null;
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  // Sin datos
  if (data.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-md p-8 text-center">
        <p className="text-amber-800 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // Renderizar vista correspondiente
  return (
    <div className={`universal-table-container ${className}`}>
      {isMobile ? (
        <CardsView
          data={data}
          columns={columns}
          onRowClick={onRowClick}
          showIndex={showIndex}
        />
      ) : (
        <TableView
          data={data}
          columns={columns}
          onRowClick={onRowClick}
          showIndex={showIndex}
          indexLabel={indexLabel}
          striped={striped}
          hoverable={hoverable}
        />
      )}
    </div>
  );
};

UniversalTable.propTypes = {
  /** Array de datos a mostrar */
  data: PropTypes.array.isRequired,
  /** Configuración de columnas */
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['text', 'photo', 'badge', 'custom', 'actions']).isRequired,
      photoField: PropTypes.string, // Campo para StudentPhoto (ej: 'codigo_estudiante')
      render: PropTypes.func, // Función custom de renderizado
      getBadgeProps: PropTypes.func, // Función para obtener props del badge
      actions: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string,
          icon: PropTypes.elementType,
          onClick: PropTypes.func.isRequired,
          variant: PropTypes.string,
          tooltip: PropTypes.string,
          show: PropTypes.func, // Función para mostrar/ocultar acción condicionalmente
        })
      ),
      align: PropTypes.oneOf(['left', 'center', 'right']),
      width: PropTypes.string,
      className: PropTypes.string,
    })
  ).isRequired,
  /** Estado de carga */
  loading: PropTypes.bool,
  /** Mensaje cuando no hay datos */
  emptyMessage: PropTypes.string,
  /** Callback al hacer clic en una fila */
  onRowClick: PropTypes.func,
  /** Clases CSS adicionales */
  className: PropTypes.string,
  /** Breakpoint para cambiar a vista mobile (px) */
  breakpoint: PropTypes.number,
  /** Mostrar columna de índice */
  showIndex: PropTypes.bool,
  /** Label para columna de índice */
  indexLabel: PropTypes.string,
  /** Filas con fondo alternado */
  striped: PropTypes.bool,
  /** Efecto hover en filas */
  hoverable: PropTypes.bool,
};

export default UniversalTable;