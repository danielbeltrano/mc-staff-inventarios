// Validate document number (assuming it's numeric)
const validateDocumentNumber = (documentNumber) => {
    const re = /^[0-9]+$/;
    return re.test(documentNumber);
  };
  
  // Validate if the input is an email
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };