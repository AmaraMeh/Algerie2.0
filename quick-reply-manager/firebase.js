// Firebase auth and Firestore REST helpers tailored for Chrome extensions
// Uses chrome.identity to get an OAuth token and calls Firestore REST with it.

(function () {
	const PROJECT_ID = "amara-8a16f";
	const API_KEY = "AIzaSyAtscANFcA8pwPFCMtpLsqUIuQDG93VPL0";

	let authState = { token: null, user: null };

	async function getAuthToken(interactive) {
		return new Promise((resolve, reject) => {
			try {
				chrome.identity.getAuthToken({ interactive: !!interactive }, (token) => {
					if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
					resolve(token || null);
				});
			} catch (e) {
				reject(e);
			}
		});
	}

	async function fetchUserInfo(token) {
		const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
			headers: { Authorization: `Bearer ${token}` }
		});
		if (!res.ok) throw new Error("userinfo failed");
		return res.json();
	}

	async function signIn(interactive) {
		const token = await getAuthToken(interactive);
		if (!token) throw new Error("No token");
		const user = await fetchUserInfo(token);
		authState = { token, user };
		return { token, user };
	}

	async function signOut() {
		try {
			if (authState.token) {
				chrome.identity.removeCachedAuthToken({ token: authState.token }, () => {});
			}
		} catch (_) {}
		authState = { token: null, user: null };
	}

	function getAuthState() {
		return { ...authState };
	}

	async function loadIfSignedIn() {
		try {
			const token = await getAuthToken(false);
			if (!token) return null;
			authState.token = token;
			if (!authState.user) {
				try { authState.user = await fetchUserInfo(token); } catch (_) {}
			}
			const data = await pullCloudData();
			return { data };
		} catch (_) {
			return null;
		}
	}

	// Firestore documents under: users/{uid}/qrm/settings (single doc) for categories
	function getSettingsDocPath(uid) {
		return `projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}/qrm/settings`;
	}

	async function pullCloudData() {
		if (!authState.token || !authState.user) return null;
		const uid = authState.user.sub || authState.user.email || "me";
		const url = `https://firestore.googleapis.com/v1/${getSettingsDocPath(uid)}?key=${API_KEY}`;
		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${authState.token}` }
		});
		if (res.status === 404) return null;
		if (!res.ok) throw new Error("pull failed");
		const doc = await res.json();
		return decodeCategoriesDoc(doc);
	}

	async function pushLocalToCloud() {
		if (!authState.token || !authState.user) return;
		const local = await window.QRMStorage.getData();
		const uid = authState.user.sub || authState.user.email || "me";
		const url = `https://firestore.googleapis.com/v1/${getSettingsDocPath(uid)}?key=${API_KEY}`;
		const body = encodeCategoriesDoc(local);
		const res = await fetch(url, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${authState.token}`
			},
			body: JSON.stringify(body)
		});
		if (res.status === 404) {
			// Try create with POST to parent collection path
			const parent = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}/qrm?documentId=settings&key=${API_KEY}`;
			const createRes = await fetch(parent, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${authState.token}` },
				body: JSON.stringify(body)
			});
			if (!createRes.ok) throw new Error("create failed");
			return;
		}
		if (!res.ok) throw new Error("push failed");
	}

	function encodeCategoriesDoc(data) {
		return {
			fields: {
				categories: {
					arrayValue: {
						values: (data.categories || []).map((c) => ({
							mapValue: {
								fields: {
									id: { stringValue: c.id },
									name: { stringValue: c.name },
									templates: {
										arrayValue: {
											values: (c.templates || []).map((t) => ({
												mapValue: {
													fields: {
														id: { stringValue: t.id },
														title: { stringValue: t.title },
														text: { stringValue: t.text }
													}
												}
											}))
										}
									}
								}
							}
						}))
					}
				}
			}
		};
	}

	function decodeCategoriesDoc(doc) {
		try {
			const cats = (doc.fields?.categories?.arrayValue?.values || []).map((v) => {
				const f = v.mapValue.fields || {};
				return {
					id: f.id?.stringValue || crypto.randomUUID(),
					name: f.name?.stringValue || "Sans nom",
					templates: (f.templates?.arrayValue?.values || []).map((tv) => {
						const tf = tv.mapValue.fields || {};
						return {
							id: tf.id?.stringValue || crypto.randomUUID(),
							title: tf.title?.stringValue || "",
							text: tf.text?.stringValue || ""
						};
					})
				};
			});
			return { categories: cats };
		} catch (_) {
			return null;
		}
	}

	window.QRMCloud = {
		signIn,
		signOut,
		getAuthState,
		loadIfSignedIn,
		pushLocalToCloud
	};
})();

