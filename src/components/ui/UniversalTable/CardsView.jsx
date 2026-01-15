// src/components/ui/UniversalTable/CardsView.jsx
import React from 'react';
import StudentPhoto from '../../StudentPhoto';
import Tooltip from '../Tooltip';
import {Badge} from '../Badge';

/**
 * Vista de cards para mobile
 */
const CardsView = ({ data, columns, onRowClick, showIndex }) => {
  /**
   * Renderiza el contenido según el tipo de columna
   */
  const renderFieldValue = (column, row) => {
    const value = row[column.key];

    switch (column.type) {
      case 'photo':
        return null; // Las fotos se muestran en el header del card

      case 'badge':
        if (column.getBadgeProps) {
          const badgeProps = column.getBadgeProps(value, row);
          return <Badge {...badgeProps} />;
        }
        return <span className="px-2 py-1 bg-gray-200 rounded text-sm">{value}</span>;

      case 'actions':
        return (
          <div className="flex gap-2 flex-wrap">
            {column.actions?.map((action, idx) => {
              if (action.show && !action.show(row)) {
                return null;
              }

              const ActionIcon = action.icon;
              const button = (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(row);
                  }}
                  className={`
                    p-2 rounded-full transition-all duration-150
                    ${getActionVariantClass(action.variant)}
                  `}
                  aria-label={action.label}
                >
                  {ActionIcon && <ActionIcon size={20} />}
                </button>
              );

              return action.tooltip ? (
                <Tooltip key={idx} text={action.tooltip}>
                  {button}
                </Tooltip>
              ) : (
                button
              );
            })}
          </div>
        );

      case 'custom':
        return column.render ? column.render(value, row) : value;

      case 'text':
      default:
        return <span className="text-gray-700">{value ?? 'N/A'}</span>;
    }
  };

  const getActionVariantClass = (variant) => {
    const variants = {
      primary: 'bg-blue-500 hover:bg-blue-600 text-white',
      secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
      success: 'bg-green-500 hover:bg-green-600 text-white',
      danger: 'bg-red-500 hover:bg-red-600 text-white',
      warning: 'bg-amber-500 hover:bg-amber-600 text-white',
      info: 'bg-sky-500 hover:bg-sky-600 text-white',
      orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    };
    return variants[variant] || variants.primary;
  };

  // Encontrar la columna de foto si existe
  const photoColumn = columns.find((col) => col.type === 'photo');
  const photoField = photoColumn?.photoField || 'codigo_estudiante';

  return (
    <div className="space-y-3">
      {data.map((row, rowIndex) => (
        <div
          key={rowIndex}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={`
            bg-white rounded-lg shadow-md border border-amber-default p-4
            ${onRowClick ? 'cursor-pointer hover:shadow-lg' : ''}
            transition-shadow duration-200
          `}
        >
          {/* Header con foto y datos principales */}
          <div className="flex items-start gap-4 mb-4 pb-4 border-b border-amber-default">
            {/* Índice (si está habilitado) */}
            {showIndex && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-default text-white rounded-full flex items-center justify-center font-semibold">
                {rowIndex + 1}
              </div>
            )}

            {/* Foto */}
            {photoColumn && (
              <div className="flex-shrink-0">
                <StudentPhoto codigoEstudiante={row[photoField]} />
              </div>
            )}

            {/* Información principal (primeras 2 columnas de texto) */}
            <div className="flex-grow min-w-0">
              {columns
                .filter((col) => col.type === 'text')
                .slice(0, 2)
                .map((column) => (
                  <div key={column.key} className="mb-1">
                    <p className="text-sm font-semibold text-blue-default truncate">
                      {row[column.key] ?? 'N/A'}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Resto de campos */}
          <div className="space-y-3">
            {columns
              .filter((col) => col.type !== 'photo')
              .slice(2) // Omitir las primeras 2 que ya se mostraron arriba
              .map((column) => (
                <div key={column.key} className="flex justify-between items-start gap-2">
                  <span className="text-sm font-semibold text-gray-600 flex-shrink-0">
                    {column.label}:
                  </span>
                  <div className="text-right flex-grow">
                    {renderFieldValue(column, row)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardsView;