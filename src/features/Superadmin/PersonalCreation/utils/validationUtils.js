/**
 * Utilidades para validación de formularios
 */

/**
 * Validar correo institucional
 * @param {string} email - Correo a validar
 * @returns {Object} { isValid, message }
 */
export const validateInstitutionalEmail = (email) => {
  if (!email) {
    return { isValid: false, message: 'El correo es requerido' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Formato de correo inválido' };
  }

  if (!email.endsWith('@gimnasiomariecurie.edu.co')) {
    return { isValid: false, message: 'El correo debe pertenecer al dominio @gimnasiomariecurie.edu.co' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validar nombre (solo letras, espacios y algunos caracteres especiales)
 * @param {string} name - Nombre a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @param {boolean} required - Si el campo es requerido
 * @returns {Object} { isValid, message }
 */
export const validateName = (name, fieldName = 'Nombre', required = true) => {
  if (!name || !name.trim()) {
    if (required) {
      return { isValid: false, message: `${fieldName} es requerido` };
    }
    return { isValid: true, message: '' };
  }

  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, message: `${fieldName} solo puede contener letras, espacios, apostrofes y guiones` };
  }

  if (name.trim().length < 2) {
    return { isValid: false, message: `${fieldName} debe tener al menos 2 caracteres` };
  }

  if (name.trim().length > 50) {
    return { isValid: false, message: `${fieldName} no puede exceder 50 caracteres` };
  }

  return { isValid: true, message: '' };
};

/**
 * Validar cargo
 * @param {string} cargo - Cargo a validar
 * @returns {Object} { isValid, message }
 */
export const validateCargo = (cargo) => {
  if (!cargo || !cargo.trim()) {
    return { isValid: true, message: '' }; // Campo opcional
  }

  if (cargo.trim().length < 3) {
    return { isValid: false, message: 'El cargo debe tener al menos 3 caracteres' };
  }

  if (cargo.trim().length > 100) {
    return { isValid: false, message: 'El cargo no puede exceder 100 caracteres' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validar selección de rol
 * @param {string} rol - Rol seleccionado
 * @returns {Object} { isValid, message }
 */
export const validateRol = (rol) => {
  if (!rol) {
    return { isValid: false, message: 'Debe seleccionar un rol' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validar permisos de servicios
 * @param {Object} permisos - Objeto con permisos booleanos
 * @returns {Object} { isValid, message }
 */
export const validatePermisos = (permisos) => {
  const hasAtLeastOnePermission = Object.values(permisos).some(permission => permission === true);
  
  if (!hasAtLeastOnePermission) {
    return { isValid: false, message: 'Debe asignar al menos un permiso de servicio' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validar formulario completo
 * @param {Object} formData - Datos del formulario
 * @returns {Object} { isValid, errors }
 */
export const validatePersonalForm = (formData) => {
  const errors = {};

  // Validar correo
  const emailValidation = validateInstitutionalEmail(formData.correoInstitucional);
  if (!emailValidation.isValid) {
    errors.correoInstitucional = emailValidation.message;
  }

  // Validar primer nombre
  const primerNombreValidation = validateName(formData.primerNombre, 'Primer nombre', true);
  if (!primerNombreValidation.isValid) {
    errors.primerNombre = primerNombreValidation.message;
  }

  // Validar segundo nombre (opcional)
  const segundoNombreValidation = validateName(formData.segundoNombre, 'Segundo nombre', false);
  if (!segundoNombreValidation.isValid) {
    errors.segundoNombre = segundoNombreValidation.message;
  }

  // Validar primer apellido
  const primerApellidoValidation = validateName(formData.primerApellido, 'Primer apellido', true);
  if (!primerApellidoValidation.isValid) {
    errors.primerApellido = primerApellidoValidation.message;
  }

  // Validar segundo apellido (opcional)
  const segundoApellidoValidation = validateName(formData.segundoApellido, 'Segundo apellido', false);
  if (!segundoApellidoValidation.isValid) {
    errors.segundoApellido = segundoApellidoValidation.message;
  }

  // Validar rol
  const rolValidation = validateRol(formData.rol);
  if (!rolValidation.isValid) {
    errors.rol = rolValidation.message;
  }

  // Validar cargo (opcional)
  const cargoValidation = validateCargo(formData.cargo);
  if (!cargoValidation.isValid) {
    errors.cargo = cargoValidation.message;
  }

  // Validar permisos
  const permisosValidation = validatePermisos(formData.permisos);
  if (!permisosValidation.isValid) {
    errors.permisos = permisosValidation.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};