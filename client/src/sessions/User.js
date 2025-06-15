import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseCreds';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

export const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	useEffect(() => onAuthStateChanged(auth, setUser), []);
	useEffect(() => console.log('user email:', user?.email), [user]);
	return (
		<UserContext.Provider value={{ user, setUser }}>
			{children}
		</UserContext.Provider>
	);
}

export const Logout = async () => {
	try {
		await signOut(auth);
	} catch (e) {
		console.error('Logout error:', e);
	}
}

export const EmailLogin = ({ setCreatingUser }) => {
	const [email, setEmail] = useState('');
	const [pw, setPw] = useState('');
	const [error, setError] = useState(null);

	const signIn = async () => {
		try {
			await signInWithEmailAndPassword(auth, email, pw);
		} catch (e) {
			setError(e.message);
		}
	};

	return (
		<SafeAreaView style={{ ...styles.mainContainer, marginTop: 16 }}>
			<View style={styles.flexRow}>
				<Text style={{ ...styles.smallText, paddingLeft: 8 }}>Email:</Text>
				<TextInput 
					style={{ ...styles.smallInput, flex: 1, flexShrink: 1, marginRight: 32 }} 
					value={email} 
					onChangeText={setEmail} 
					multiline
					textAlignVertical="top"
				/>
			</View>
			<View style={styles.flexRow}>
				<Text style={{ ...styles.smallText, paddingLeft: 8 }}>Password:</Text>
				<TextInput 
					style={{ ...styles.smallInput, flex: 1, flexShrink: 1, marginRight: 32 }} 
					value={pw} 
					onChangeText={setPw} 
					secureTextEntry
					textAlignVertical="top"
				/>
			</View>
			{error && <Text style={{ color: 'red', paddingLeft: 8 }}>{error}</Text>}
			<TouchableOpacity style={{ ...styles.tag, marginLeft: 8, alignSelf: 'flex-start' }} onPress={signIn}>
				<Text style={styles.largeText}>Sign in</Text>
			</TouchableOpacity>
			<TouchableOpacity style={{ ...styles.tag, marginLeft: 8, alignSelf: 'flex-start' }} onPress={() => setCreatingUser(true)}>
				<Text style={styles.largeText}>Register</Text>
			</TouchableOpacity>
		</SafeAreaView>
	);
}

export const CreateUser = ({ setCreatingUser }) => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [error, setError] = useState(null);

	const handleCreate = async () => {
		if (!email || !password) {
			setError('Email and password are required');
			return;
		}
		if (password !== confirm) {
			setError('Passwords do not match');
			return;
		}

		try {
			setError(null);

			const { user } = await createUserWithEmailAndPassword(
				auth,
				email.trim(),
				password
			);

			const localPart = email.split('@')[0];
			await updateProfile(user, { displayName: localPart });

		} catch (e) {
			setError(e.message);
		} finally {
			setCreatingUser(false);
		}
	};

	return (
		<SafeAreaView style={{ ...styles.mainContainer, marginTop: 16 }}>
			<View style={styles.flexRow}>
				<Text style={{ ...styles.smallText, paddingLeft: 8 }}>Email:</Text>
				<TextInput
					style={{ ...styles.smallInput, flex: 1, flexShrink: 1, marginRight: 32 }} 
					placeholder="email"
					textAlignVertical="top"
					value={email}
					onChangeText={setEmail}
				/>
			</View>
			<View style={styles.flexRow}>
				<Text style={{ ...styles.smallText, paddingLeft: 8 }}>Password:</Text>
				<TextInput
					style={{ ...styles.smallInput, flex: 1, flexShrink: 1, marginRight: 32 }} 
					placeholder="password"
					secureTextEntry
					textAlignVertical="top"
					value={password}
					onChangeText={setPassword}
				/>
			</View>
			<View style={styles.flexRow}>
				<Text style={{ ...styles.smallText, paddingLeft: 8 }}>Confirm Password:</Text>
				<TextInput
					style={{ ...styles.smallInput, flex: 1, flexShrink: 1, marginRight: 32 }} 
					placeholder="password"
					secureTextEntry
					textAlignVertical="top"
					value={confirm}
					onChangeText={setConfirm}
				/>
			</View>
			{error && <Text style={{ color: 'red', marginTop: 4, paddingLeft: 8 }}>{error}</Text>}
			<View style={styles.flexRow}>
				<TouchableOpacity
					style={{ ...styles.tag, marginLeft: 8, alignSelf: 'flex-start' }}
					onPress={handleCreate}
					>
					<Text style={styles.largeText}>Create account</Text>
				</TouchableOpacity>
			</View>
			<View style={styles.flexRow}>
				<TouchableOpacity
					style={{ ...styles.tag, marginLeft: 8, alignSelf: 'flex-start' }}
					onPress={() => setCreatingUser(false)}
					>
					<Text style={styles.largeText}>Cancel</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}
