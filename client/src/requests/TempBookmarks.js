import { useCallback } from 'react';
import { useFetchWithAuth } from './General';

export const useFetchTempBookmarks = () => {
	const fetchWithAuth = useFetchWithAuth();

	return useCallback(async () => {
		const res = await fetchWithAuth('tempBookmarks', '', {});
		if (!res.ok) throw new Error(`GET tempBookmarks status: ${res.status}`);
		const bookmarks = await res.json();
		const sortedBookmarks = bookmarks.sort((a, b) => a.path.localeCompare(b.path));
		return sortedBookmarks;
	}, [fetchWithAuth]);
};