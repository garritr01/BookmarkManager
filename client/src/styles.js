import { StyleSheet } from 'react-native';

const rowSpace = 4;
const fontSizeLarge = 24;
const fontSizeSmall = 20;
export const borderColor = '#070707';
export const iconSize = 20;

export const styles = StyleSheet.create({

	mainContainer: {
		flex: 1, 
		backgroundColor: '#d2effd',
	},

	navBar: {
		backgroundColor: '#a7e8f8',
	},

	navTitle: {
		fontSize: fontSizeLarge,
	},

	navButtonL: {
		marginLeft: 16,
	},

	navButtonR: {
		marginRight: 16,
	},

	flexColumn: {
		flexDirection: 'column',
	},

	flexRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap',
		paddingVertical: rowSpace,
		gap: 8,
	},

	depthSpacer: {
		alignSelf: 'stretch',
		borderRightColor: borderColor,
		borderRightWidth: 1,
		width: 1,
		marginVertical: -rowSpace,
	},

	tag: {
		borderWidth: 1,
		borderColor: borderColor,
		borderRadius: 8,
		paddingVertical: 4,
		paddingHorizontal: 8,
	},

	sectionHeader: {
		alignSelf: 'flex-start',
		borderWidth: 1,
		borderColor: borderColor,
		borderRadius: 8,
		fontSize: fontSizeLarge,
		padding: 8,
		marginVertical: 12,
		marginLeft: 8,
	},

	largeText: {
		fontSize: fontSizeLarge,
		textAlign: 'center',
	},

	smallText: {
		fontSize: fontSizeSmall,
		textAlign: 'center',
	},

	bookmarkLink: {
		fontSize: fontSizeSmall,
		color: '#0645ad',
		textDecorationLine: 'underline',
	},

	largeInput: {
		fontSize: fontSizeLarge,
		lineHeight: fontSizeLarge,
		textAlign: 'center',
		borderBottomWidth: 1,
		borderBottomColor: borderColor,
		textAlign: "left",
		flexShrink: 1,
	},

	smallInput: {
		fontSize: fontSizeSmall,
		lineHeight: fontSizeSmall,
		textAlign: 'center',
		borderBottomWidth: 1,
		borderBottomColor: borderColor,
		textAlign: "left",
		flexShrink: 1,
	},

	activeDir: {
		padding: 8,
		borderWidth: 1,
		borderColor: borderColor,
		borderRadius: 8,
	},

});