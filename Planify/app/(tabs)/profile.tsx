import { supabase } from '@/lib/sypabase';
import { Button, StyleSheet, Text, View } from 'react-native';


export default function ProfileScreen() {
	const handleLogout = () => {
		supabase.auth.signOut();
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Mon Profile</Text>
			<Button
				title="Déconnexion"
				onPress={handleLogout}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: '80%',
	},
});
