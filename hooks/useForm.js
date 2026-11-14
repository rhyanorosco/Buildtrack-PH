// Tiny form-state helper: keeps field values (as strings) and error messages together.
import { useCallback, useState } from 'react';

export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  // setField('name') returns an onChange handler for that field.
  // Typing in a field clears its error message.
  const setField = useCallback(
    (name) => (value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
    },
    [],
  );

  return { values, setValues, errors, setErrors, setField };
}

/** Converts a stored number to text for an input (null/undefined -> ''). */
export function toInputText(value) {
  return value == null || value === '' ? '' : String(value);
}
