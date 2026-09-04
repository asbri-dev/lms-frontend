// src/utils/academicYear.js

export const getCurrentAcademicYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  // Academic year starts in July
  const startYear = month >= 7 ? year : year - 1;

  return `${startYear}-${String(startYear + 1)}`;
};

export const CURRENT_ACADEMIC_YEAR = getCurrentAcademicYear();