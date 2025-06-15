import { useCallback } from 'react';
import { useFetchWithAuth } from './General';

export const useFetchBookmarks = () => {
	const fetchWithAuth = useFetchWithAuth();

	return useCallback(async () => {
		const res = await fetchWithAuth('bookmarks', '', {});
		if (!res.ok) throw new Error(`GET bookmarks status: ${res.status}`);
		const bookmarks = await res.json();
		const sortedBookmarks = bookmarks.sort((a, b) => a.path.localeCompare(b.path));
		return sortedBookmarks;
	}, [fetchWithAuth]);
};