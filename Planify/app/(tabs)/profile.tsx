// tabs/profile.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { supabase } from '../../lib/sypabase'; 
import { useAuth } from '@/providers/AuthProvider';

export default function ProfileScreen() {
  const { session } = useAuth(); // Récupérer la session de l'utilisateur via le contexte AuthProvider
  const [user, setUser] = useState<any>(null); // État pour stocker les informations de l'utilisateur

  useEffect(() => {
    // Si l'utilisateur est connecté, récupérer ses informations depuis Supabase
    if (session) {
      const fetchUser = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user?.id)
          .single(); // Utiliser single() pour obtenir une seule ligne

        if (error) {
          console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        } else {
          setUser(data); // Mettre à jour l'état avec les informations de l'utilisateur
        }
      };

      fetchUser();
    }
  }, [session]); // L'effet se déclenche à chaque changement de session

  const handleLogout = async () => {
    await supabase.auth.signOut(); // Déconnexion de l'utilisateur via Supabase
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Vous n'êtes pas connecté.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Profil</Text>
      {user ? (
        <View style={styles.profileContainer}>
          <Text style={styles.profileItem}>Nom : {user.name}</Text>
          <Text style={styles.profileItem}>Email : {user.email}</Text>
        </View>
      ) : (
        <Text style={styles.profileItem}>Chargement...</Text>
      )}
      <Button title="Se déconnecter" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileContainer: {
    marginBottom: 20,
  },
  profileItem: {
    fontSize: 18,
    marginBottom: 10,
  },
});
