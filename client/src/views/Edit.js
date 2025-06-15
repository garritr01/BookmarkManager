import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Keyboard, TouchableOpacity } from 'react-native';
import { Feather } from 'react-native-vector-icons';
import { styles, iconSize } from '../styles';
import { useSave } from '../requests/General';

export const EditBookmarks = ({ navigation, route, selected, setSelected, setBookmarks, setFetchTempFlag, setTemps }) => {
	const [bookmark, setBookmark] = useState({ ...selected });
	const save = useSave();

	const handleChange = (newVal, prop) => {
		setBookmark(prev => ({ ...prev, [prop]: newVal }));
	}

	const saveBookmark = async () => {
		try {
			const { temp, _id, ...rest } = bookmark;
			const toSave = (!temp && _id) ? { _id, ...rest } : rest // save without _id if new or from temp
			const updated = await save('bookmarks', 'POST', toSave);
			console.log("Successful bookmark save");
			setSelected({
				url: '',
				path: '',
				tags: [],
				notes: '',
			});
			updateBookmarks(updated);
			navigation.navigate("List");

			// Delete temp on successful save
			if (temp) {
				const resp = await save('tempBookmarks', 'DELETE', bookmark);
				console.log("Successful temp deletion after bookmark save.")
				setFetchTempFlag(prev => !prev);
			}
		} catch (err) {
			console.error("Save failed... ", err);
		}
	}

	const saveTemp = async () => {
		try {
			const updated = await save('tempBookmarks', 'POST', bookmark);
			console.log("Successful temp save.");
			setSelected({
				url: '',
				path: '',
				tags: [],
				notes: '',
			});
			setFetchTempFlag(prev => !prev);
			navigation.navigate("List");
		} catch (err) {
			console.error("Temp save failed... ", err);
		}
	}

	const updateBookmarks = (updated) => {
		setBookmarks(prev =>
			prev.some(b => b._id === updated._id)
				? prev.map(b => b._id === updated._id ? updated : b)
				: [...prev, updated]
		);
	}

	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<TouchableOpacity onPress={() => navigation.navigate("List")} style={styles.navButtonL}>
					<Text style={styles.smallText}>Cancel</Text>
				</TouchableOpacity>
			),
			headerRight: () => (
				<TouchableOpacity onPress={saveBookmark} style={styles.navButtonR}>
					<Text style={styles.smallText}>Save</Text>
				</TouchableOpacity>
			)
		});
	}, [route, navigation, saveBookmark, updateBookmarks]);

	return (
		<View style={styles.mainContainer}>
			<View style={{ ...styles.flexRow, paddingLeft: 8 }}>
				<Text style={styles.smallText}>URL: </Text>
				<TextInput
					style={styles.smallInput}
					multiline
					textAlignVertical="top"
					value={bookmark.url}
					placeholder="https..."
					onChangeText={(text) => handleChange(text, 'url')}
				/>
			</View>
			<View style={{ ...styles.flexRow, paddingLeft: 8 }}>
				<Text style={styles.smallText}>Path: </Text>
				<TextInput
					style={styles.smallInput}
					multiline
					textAlignVertical="top"
					value={bookmark.path}
					placeholder="bills/rent..."
					onChangeText={(text) => handleChange(text, 'path')}
				/>
			</View>
			<View style={{ ...styles.flexRow, paddingLeft: 8 }}>
				<Text style={styles.smallText}>Tags: </Text>
				<TagList 
					bookmark={bookmark}
					setBookmark={setBookmark}
				/>
			</View>
			<View style={{ ...styles.flexRow, paddingLeft: 8 }}>
				<Text style={{ ...styles.smallText, textAlign: "left" }}>Notes: </Text>
				<TextInput
					style={styles.smallInput}
					multiline
					textAlignVertical="top"
					value={bookmark.notes}
					placeholder="Anything you want..."
					onChangeText={(text) => handleChange(text, 'notes')}
				/>
			</View>
			<TouchableOpacity style={{ ...styles.tag, marginLeft: 8, alignSelf: 'flex-start' }} onPress={saveTemp}>
				<Text style={styles.largeText}>Save Temp</Text>
			</TouchableOpacity>
		</View>
	)
}

const TagList = ({ bookmark, setBookmark }) => {

	const [newTag, setNewTag] = useState('');

	const removeTag = (idx) => {
		const newTags = [...bookmark.tags];
		newTags.splice(idx, 1);
		setBookmark(prev => ({ ...prev, tags: newTags }));
	}

	const addTag = () => {
		setBookmark(prev => ({ ...prev, tags: [...prev.tags, newTag]}));
		setNewTag('');
	}

	return (
		<View style={styles.flexRow}>
			{bookmark && bookmark?.tags?.map((tag, idx) => (
				<View key={idx} style={{ ...styles.flexRow, ...styles.tag }}>
					<TouchableOpacity onPress={() => removeTag(idx)}>
						<Feather name="x" size={iconSize} />
					</TouchableOpacity>
					<Text style={styles.smallText}>{tag}</Text>
				</View>
			))}

			<View style={styles.flexRow}>
				<TextInput
					style={styles.smallInput}
					value={newTag}
					multiline
					textAlignVertical="top"
					placeholder="Keyword..."
					onChangeText={(text) => setNewTag(text)}
				/>
				<TouchableOpacity onPress={() => addTag()}>
					<Feather name="check" size={iconSize} />
				</TouchableOpacity>
			</View>

		</View>
	)
}