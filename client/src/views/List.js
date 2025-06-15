import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, SectionList } from 'react-native';
import { Feather } from 'react-native-vector-icons';
import { styles, iconSize, borderColor } from '../styles';
import { useSave } from '../requests/General';
import { Logout } from '../sessions/User';

export const ListBookmarks = ({ navigation, route, bookmarks, setBookmarks, temps, setTemps, setSelected }) => {
	const [open, setOpen] = useState([]);
	const [deleting, setDeleting] = useState([]);
	const save = useSave();

	// Open directory to view subdirectories and bookmarks
	const handleDirectoryClick = (dir) => {
		if (open.some(o => o.path === dir.path)) {
			setOpen(prev => prev.filter(o => !o.path.startsWith(dir.path)));
		} else {
			setOpen(prev => ([...prev, { path: dir.path }]));
		}
	}

	// Nav to edit for selected bookmark
	const handleBookmarkEditClick = (bookmark) => {
		setSelected(bookmark);
		navigation.navigate("Edit");
	}

	const handleRedirect = (bookmark) => {
		if (bookmark?.url) {
			Linking.canOpenURL(bookmark.url)
				.then(can => {
					if (can) {
						Linking.openURL(bookmark.url);
					} else {
						console.error("Cannot open url: ", bookmark.url)
					}
				})
				.catch(e => console.error("Error attempting to redirect to: ", bookmark.url))
		} else {
			console.warning("No URL in bookmark: ", bookmark);
		}
	}

	// Hit correct delete route depending on bools
	const deleteBookmarks = async (item) => {
		// Delete temp, bookmark, or directory
		const url = item.temp ? 'tempBookmarks' : '_id' in item ? 'bookmarks' : 'bookmarks/dir'
		try {
			const resp = await save(url, 'DELETE', item);
			console.log("Successful directory deletion.");
			if (item.temp) { updateTemps(resp.deleted) }
			else { updateBookmarks(resp.deleted) }
		} catch (err) {
			console.error("Directory deletion failed...", err);
		}
	}

	// Filter deleted items
	const updateBookmarks = (deleted) => {
		setBookmarks(prev => prev.filter((b) => !deleted.includes(b._id)));
	}
	const updateTemps = (deleted) => {
		setTemps(prev => prev.filter((b) => !deleted.includes(b._id)));
	}

	// Get all top level directories and the subdirectories of all opened directories
	const filteredBookmarks = useMemo(() => {
		
		// Get all subdirectories/bookmarks in open directories along with the top level directories/bookmarks
		const shrunk = bookmarks.map((b) => {
			const parentDir = b.path.split('/').slice(0, -1).join('/');
			if (!parentDir) {
				return b;
			}

			const matches = open.filter(o => b.path.startsWith(o.path + '/'));
			const deepestMatch = matches.reduce((maxLen, curr) => 
				curr.path.split('/').length >= maxLen.path.split('/').length ? curr : maxLen, { path: '' }
			).path;

			if (!deepestMatch) {
				return { path: b.path.split('/')[0] };
			} else if (deepestMatch === parentDir) {
				return b;
			} else {
				return { path: b.path.split('/').slice(0, deepestMatch.split('/').length + 1).join('/') };
			}
		});

		// Filter for uniqueness
		const seen = new Set();
		const unique = shrunk.filter((b) => {
			if (seen.has(b.path)) { return false }
			seen.add(b.path);
			return true;
		});

		return [ ...unique, ...open ].sort((a, b) => a.path.localeCompare(b.path));

	}, [bookmarks, open]);

	const sections = useMemo(() => {
		const cleanTemps = temps.filter(t => t && typeof t.path === 'string');
		return [
			{ title: 'Awaiting Approval', data: cleanTemps.map(t => ({ ...t, temp: true }))},
			{ title: 'Bookmarks', data: filteredBookmarks.map(p => ({ ...p, temp: false }))},
		].filter(s => s.data.length > 0);
	},[temps, filteredBookmarks, open]);

	// Nav header
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<TouchableOpacity onPress={() => Logout()} style={styles.navButtonL}>
					<Text style={styles.smallText}>Logout</Text>
				</TouchableOpacity>
			),
			headerRight: () => (
				<TouchableOpacity onPress={() => navigation.navigate("Edit")} style={styles.navButtonR}>
					<Feather name="edit" size={30} />
				</TouchableOpacity>
			)
		})
	}, [route, navigation, handleBookmarkEditClick]);

	return (
		<View style={styles.mainContainer}>
			{sections && 
				<SectionList
					style={styles.mainContainer}
					sections={sections}
					renderSectionHeader={({ section }) => (
						<Text style={styles.sectionHeader}>{section.title}</Text>
					)}
					keyExtractor={(item, idx) => {
						if (item && item._id) return item._id;
						if (item && item.path) return `dir-${item.path}`;
						return `stub-${idx}`;
					}}
					renderItem={({ item }) => 
						<RenderBookmark
							item={item}
							open={open}
							deleting={deleting}
							setDeleting={setDeleting}
							handleDirectoryClick={handleDirectoryClick}
							handleBookmarkEditClick={handleBookmarkEditClick}
							handleRedirect={handleRedirect}
							deleteBookmarks={deleteBookmarks}
						/>
					}
				/>
			}
		</View>
	);
}

const RenderBookmark = ({ item, open, deleting, setDeleting, handleDirectoryClick, handleBookmarkEditClick, handleRedirect, deleteBookmarks }) => {

	return (
		<View style={styles.flexRow}>
			{item.temp ?
				<View style={styles.depthSpacer} />
				:
				item.path.split('/').map((dir, idx) => (
					<View key={idx} style={styles.depthSpacer} />
				))
			}
			<View style={styles.depthSpacer} />
			{'_id' in item ?
				<>
					<TouchableOpacity onPress={() => handleRedirect(item)}>
						<Text style={styles.bookmarkLink}>{item.temp ? item.path : item.path.split('/')[item.path.split('/').length - 1]}</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => handleBookmarkEditClick(item)}>
						<Feather name="edit-2" size={iconSize} />
					</TouchableOpacity>
				</>
				:
				<>
					<TouchableOpacity onPress={() => handleDirectoryClick(item)}>
						<Text 
							style={open.some(o => o.path === item.path) ? { ...styles.smallText, ...styles.activeDir } : styles.smallText}
							>
							{item.path.split('/')[item.path.split('/').length - 1]}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity onPress={() => handleDirectoryClick(item)}>
						{open.some(o => o.path === item.path) ?
							<Feather name="chevron-up" size={iconSize} />
							:
							<Feather name="chevron-down" size={iconSize} />
						}
					</TouchableOpacity>
				</>
			}

			{!deleting.includes(item.path) ?
				<TouchableOpacity onPress={() => setDeleting(prev => ([...prev, item.path]))}>
					<Feather name="trash-2" size={iconSize} />
				</TouchableOpacity>
				:
				<>
					<TouchableOpacity onPress={() => deleteBookmarks(item)}>
						<Text style={styles.smallText}>Confirm</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => setDeleting(prev => prev.filter((d) => d !== item.path))}>
						<Text style={styles.smallText}>Cancel</Text>
					</TouchableOpacity>
				</>
			}
		</View>
	);
}