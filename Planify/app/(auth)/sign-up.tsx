import { View, StyleSheet, TextInput, Text, Alert, Button } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { Link, Stack } from 'expo-router';
import { supabase } from '../../lib/sypabase'; 

export default function SignUpScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);

    // Inscription avec Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Erreur', error.message);
      setLoading(false);
      return;
    }


    const { user } = data;

    if (user) {
      // Ajouter l'utilisateur dans la table "users"
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert([
          {
            id: user.id,
            email: user.email,
            name: name || user.user_metadata?.full_name || 'Nom non renseigné',
          },
        ]);

      if (userError) {
        console.error('Erreur lors de l\'insertion de l\'utilisateur dans la table "users":', userError);
        Alert.alert('Erreur', 'Impossible d\'ajouter les informations dans la table users');
      } else {
        console.log('Utilisateur ajouté à la table users:', userData);
      }
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Inscription' }} />
      <View style={styles.inputView}>
        <Text style={styles.inputLabel}>Nom :</Text>
        <TextInput
          style={styles.emailInput}
          placeholder="Votre Nom"
          onChangeText={setName}
          value={name}
        />
      </View>
      
      <View style={styles.inputView}>
        <Text style={styles.inputLabel}>Email :</Text>
        <TextInput
          style={styles.emailInput}
          placeholder="test@gmail.com"
          keyboardType="email-address"
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputView}>
        <Text style={styles.inputLabel}>Mot de passe :</Text>
        <View style={styles.secureView}>
          <TextInput
            style={styles.secureInput}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
            value={password}
          />
          <FontAwesome6
            onPress={() => setShowPassword(!showPassword)}
            name={showPassword ? 'eye' : 'eye-slash'}
            size={20}
            color="black"
            style={{ marginRight: 5 }}
          />
        </View>
      </View>

      <Button
        title={loading ? 'Inscription ...' : 'Inscription'}
        onPress={handleSignUp}
      />

      <Link href={'/sign-in'} asChild>
        <Button title="Déjà un compte ?" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
    padding: 10,
  },
  inputView: {
    gap: 5,
  },
  inputLabel: {
    color: 'gray',
    fontSize: 16,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    height: 40,
    padding: 10,
  },
  secureView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    height: 40,
  },
  secureInput: {
    borderColor: 'black',
    width: '80%',
    padding: 10,
  },
});
