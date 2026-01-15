// hooks/useAgeCalculator.js
const useAgeCalculator = (fechaNacimiento, edadEstudiante) => {
    if (!fechaNacimiento || !edadEstudiante) return "N/A";
  
    try {
      const birthDate = new Date(fechaNacimiento);
      const today = new Date();
  
      // Validar que la fecha sea válida
      if (isNaN(birthDate.getTime())) {
        return "N/A";
      }
  
      // Calcular la diferencia en meses
      const monthsDiff =
        (today.getFullYear() - birthDate.getFullYear()) * 12 +
        (today.getMonth() - birthDate.getMonth());
  
      // Si es menor a 12 meses, mostrar en meses
      if (monthsDiff < 12) {
        return `${edadEstudiante} meses`;
      }
  
      // Si es mayor o igual a 12 meses, mostrar en años
      return `${edadEstudiante} años`;
    } catch (error) {
      console.warn('Error calculando edad:', error);
      return "N/A";
    }
  };
  
  export default useAgeCalculator;