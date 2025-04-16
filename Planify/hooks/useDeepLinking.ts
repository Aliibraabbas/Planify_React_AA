import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export function useDeepLinking() {
  const navigation = useNavigation();

  useEffect(() => {
    const handleDeepLink = (event: Linking.EventType) => {
      const url = event.url;
      const parsed = Linking.parse(url);
      if (parsed.path?.startsWith('event/')) {
        const eventId = parsed.path.replace('event/', '');
        navigation.navigate('VoteEvent', { eventId });
      }
    };

    Linking.addEventListener('url', handleDeepLink);
    return () => Linking.removeEventListener('url', handleDeepLink);
  }, []);
}