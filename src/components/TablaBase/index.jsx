import React from "react";

const TablaBase = ({ columnas, data }) => {
  return (
    <div className="overflow-x-auto my-6 hover:shadow-md rounded-md hover:border-amber-default border px-4 bg-white">
      <table className="min-w-full bg-white table-auto">
        <thead>
          <tr className="text-blue-default text-center">
            {columnas.map((columna, index) => (
              <th
                key={index}
                className="py-4 px-2 border-b border-amber-default"
              >
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr key={rowIndex} className="text-center">
              {columnas.map((columna, colIndex) => (
                <td key={colIndex} className="py-2 px-2 border-b">
                  {columna.render ? columna.render(item) : item[columna.campo]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaBase;
