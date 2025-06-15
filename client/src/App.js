import React, { useState, useEffect } from "react";
import { Text, View, SafeAreaView, Keyboard, TouchableWithoutFeedback } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useKeepAwake } from "expo-keep-awake";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { styles } from "./styles";
import { CreateUser, EmailLogin, UserProvider, useUser } from "./sessions/User";
import { useFetchBookmarks } from './requests/Bookmarks';
import { useFetchTempBookmarks } from './requests/TempBookmarks';
import { ListBookmarks } from "./views/List";
import { EditBookmarks } from "./views/Edit";

export const App = () => {
	return (
		<UserProvider>
			<TouchableWithoutFeedback style={{ flex: 1 }} onPress={Keyboard.dismiss}>
				<View style={styles.mainContainer}>
					<RootNav />
				</View>
			</TouchableWithoutFeedback>
		</UserProvider>
	)
}

const RootNav = () => {

	useKeepAwake(); // Keep phone screen on
	const { user } = useUser();
	const Stack = createStackNavigator();

	const [creatingUser, setCreatingUser] = useState(false)
	const [selected, setSelected] = useState({
		url: '',
		path: '',
		tags: [],
		notes: '',
	});

	const [bookmarks, setBookmarks] = useState([]);
	const fetchBookmarks = useFetchBookmarks();
	useEffect(() => {
		if (!user) {
			setBookmarks([]);
			return;
		}
		fetchBookmarks()
			.then(setBookmarks)
			.catch(() => setBookmarks([]));
	}, [user, fetchBookmarks]);

	const [tempBookmarks, setTempBookmarks] = useState([]);
	const [fetchTempFlag, setFetchTempFlag] = useState(false);
	const fetchTempBookmarks = useFetchTempBookmarks();
	useEffect(() => {
		if (!user) {
			setTempBookmarks([]);
			return;
		}
		fetchTempBookmarks()
			.then(setTempBookmarks)
			.catch(() => setTempBookmarks([]));
	}, [user, fetchTempFlag, fetchTempBookmarks]);

	useEffect(() => console.log('temp', tempBookmarks), [tempBookmarks]);
	useEffect(() => console.log('bkmks', bookmarks), [bookmarks]);

	return (
		<>
			{/** Workaround to color status bar with navigation header */}
			<SafeAreaView style={styles.navBar}><StatusBar /></SafeAreaView>

			{user ?
					<SafeAreaView style={styles.mainContainer}>
						<NavigationContainer>
							<Stack.Navigator 
								screenOptions={{ 
									headerTitleStyle: styles.navTitle,
									headerStyle: styles.navBar, 
									unmountOnBlur: true 
								}}
								>
								<Stack.Screen name="List" options={{ title: "Bookmarks" }}>
									{params => 
										<ListBookmarks 
											{...params} 
											setSelected={setSelected} 
											bookmarks={bookmarks} 
											setBookmarks={setBookmarks} 
											temps={tempBookmarks} 
											setTemps={setTempBookmarks} 
											style={styles.mainContainer}
										/>
									}
								</Stack.Screen>
								<Stack.Screen name="Edit">
									{params => 
										<EditBookmarks 
											{...params} 
											selected={selected} 
											setSelected={setSelected} 
											setTemps={setTempBookmarks}
											setFetchTempFlag={setFetchTempFlag}
											setBookmarks={setBookmarks} 
										/>
									}
								</Stack.Screen>
							</Stack.Navigator>
						</NavigationContainer>
					</SafeAreaView>
				: creatingUser ?
					<CreateUser setCreatingUser={setCreatingUser} />
				:
					<EmailLogin setCreatingUser={setCreatingUser} />
			}
		</>
	);
}

