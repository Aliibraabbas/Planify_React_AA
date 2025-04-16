import React, { useEffect } from 'react';
import { useDeepLinking } from '../../hooks/useDeepLinking'; // Assurez-vous que le chemin est correct
import CreateEventScreen from './event';

export default function App() {
  useDeepLinking();  // Appel du hook pour gérer les liens entrants
}