// src/components/ui/UniversalTable/TableView.jsx
import React from 'react';
import StudentPhoto from '../../StudentPhoto';
import Tooltip from '../Tooltip';
import { Badge } from '../Badge';

/**
 * Vista de tabla para desktop
 */
const TableView = ({
  data,
  columns,
  onRowClick,
  showIndex,
  indexLabel,
  striped,
  hoverable,
}) => {
  /**
   * Renderiza el contenido de una celda según su tipo
   */
  const renderCell = (column, row, rowIndex) => {
    const value = row[column.key];

    switch (column.type) {
      case 'photo':
        const photoField = column.photoField || 'codigo_estudiante';
        return (
          <div className="flex justify-center">
            <StudentPhoto codigoEstudiante={row[photoField]} />
          </div>
        );

      case 'badge':
        if (column.getBadgeProps) {
          const badgeProps = column.getBadgeProps(value, row);
          return (
            <div className="flex justify-center">
              <Badge {...badgeProps} />
            </div>
          );
        }
        return <span className="px-2 py-1 bg-gray-200 rounded text-sm">{value}</span>;

      case 'actions':
        return (
          <div className="flex justify-center gap-2">
            {column.actions?.map((action, idx) => {
              // Verificar si la acción debe mostrarse
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
        return column.render ? column.render(value, row, rowIndex) : value;

      case 'text':
      default:
        return <span>{value ?? 'N/A'}</span>;
    }
  };

  /**
   * Obtiene las clases CSS para el variant de acción
   */
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

  /**
   * Obtiene las clases de alineación
   */
  const getAlignClass = (align) => {
    const alignments = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };
    return alignments[align] || alignments.center;
  };

  return (
    <div className="overflow-x-auto shadow-md rounded-md border-amber-default border bg-white">
      <table className="min-w-full bg-white table-auto">
        <thead>
          <tr className="text-blue-default">
            {showIndex && (
              <th className="py-4 px-4 border-b border-amber-default text-center">
                {indexLabel}
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  py-4 px-4 border-b border-amber-default font-semibold
                  ${getAlignClass(column.align)}
                  ${column.className || ''}
                `}
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`
                ${striped && rowIndex % 2 === 0 ? 'bg-gray-50' : ''}
                ${hoverable ? 'hover:bg-amber-50' : ''}
                ${onRowClick ? 'cursor-pointer' : ''}
                transition-colors duration-150
              `}
            >
              {showIndex && (
                <td className="py-3 px-4 border-b border-gray-200 text-center">
                  {rowIndex + 1}
                </td>
              )}
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`
                    py-3 px-4 border-b border-gray-200
                    ${getAlignClass(column.align)}
                    ${column.className || ''}
                  `}
                >
                  {renderCell(column, row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;