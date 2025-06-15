import { useUser } from "../sessions/User";
import { useCallback } from "react";

const BACKEND_URL = "https://bookmarkmanagerserver.fly.dev";

/** 
 * - Hook attaches user's credentials.
 * - Static function until creds change.
 */
export const useFetchWithAuth = () => {
	const { user } = useUser();

	// Memoizatoin hook - inhibitor to useEffect's catalyst
	return useCallback(
		async (path, query = "", options = {}) => {

			if (!user) throw new Error("Not authenticated"); // frontend auth check
			const token = await user.getIdToken();
			const url = `${BACKEND_URL}/${path}${query}`;

			const resp = fetch(url, {
				...options,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // token for backend auth
					...(options.headers || {}),
				},
			});

			if ('error' in resp) {
				console.error(`Call to ${url} failed:`, e);
			}

			return resp;
		},
		[user]
	);
};

/** 
	Wrapper for useFetchWithAuth for POST/PUT.
*/
export const useSave = () => {
	const fetchWithAuth = useFetchWithAuth();

	return async (route, method, payload) => {

		const resp = await fetchWithAuth(route, "", {
			method,
			body: JSON.stringify(payload),
		});

		if (!resp.ok) {
			const { error: msg } = await resp.json().catch(() => ({}));
			throw new Error(msg || `Server returned ${resp.status}`);
		}

		return resp.json();
	};
};
