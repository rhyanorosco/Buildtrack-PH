// Puts an icon button (default "+") in the current screen's header.
// Usage: useHeaderAction({ label: 'Add expense', onPress: () => router.push('/expenses/form') });
import { createElement, useLayoutEffect, useRef } from 'react';
import { useNavigation } from 'expo-router';
import HeaderIconButton from '../components/HeaderIconButton';

export function useHeaderAction({ icon = 'add', label, onPress, enabled = true }) {
  const navigation = useNavigation();
  // Keep the latest handler without re-setting header options on every render.
  const handlerRef = useRef(onPress);
  handlerRef.current = onPress;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: enabled
        ? () => createElement(HeaderIconButton, { icon, label, onPress: () => handlerRef.current?.() })
        : undefined,
    });
  }, [navigation, icon, label, enabled]);
}
