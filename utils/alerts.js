// Shared confirmation and error dialogs.
import { Alert } from 'react-native';

/** Asks before deleting. `onConfirm` runs only if the user taps Delete. */
export function confirmDelete({ title = 'Delete?', message = 'This cannot be undone.', onConfirm }) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

/** Asks the user to confirm a non-destructive action. */
export function confirmAction({ title, message, confirmLabel = 'OK', onConfirm }) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}

/** Shows an error from a { ok, error } result. Returns true if the result was OK. */
export function handleResult(result, failTitle = 'Could not save') {
  if (result?.ok) return true;
  Alert.alert(failTitle, result?.error ?? 'Please try again.');
  return false;
}

export function showValidationAlert() {
  Alert.alert('Please check the form', 'Some fields need your attention. They are marked in red.');
}
