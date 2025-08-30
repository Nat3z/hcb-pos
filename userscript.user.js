/* eslint-disable @typescript-eslint/no-unused-vars */
// ==UserScript==
// @name         HCB PoS Token Linker
// @namespace    https://raw.githubusercontent.com/nat3z/hcb-pos/main/userscript.user.js
// @version      1.1
// @description  Extract HCB auth token and link it to PoS
// @author       nat3z
// @match        https://hcb.hackclub.com/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function () {
	'use strict';

	// Configuration keys for storing user settings
	const CONFIG_KEYS = {
		POS_URL: 'hcb_pos_url',
		API_TOKEN: 'hcb_pos_api_token'
	};

	// Extract HCB session token from cookies
	function getHCBSessionToken() {
		try {
			const sessionCookie = document.cookie
				.split(';')
				.find((s) => s.trim().startsWith('session_token'));

			if (!sessionCookie) {
				throw new Error('Session token not found');
			}

			return sessionCookie.split('=')[1];
		} catch (error) {
			console.error('You must be logged into HCB to do this!');
			return null;
		}
	}

	// Create and show configuration modal
	function showConfigModal() {
		return new Promise((resolve) => {
			// Create modal overlay
			const overlay = document.createElement('div');
			overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
            `;

			// Create modal content
			const modal = document.createElement('div');
			modal.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                max-width: 500px;
                width: 90%;
            `;

			Promise.all([
				GM.getValue(CONFIG_KEYS.POS_URL, ''),
				GM.getValue(CONFIG_KEYS.API_TOKEN, '')
			]).then(([currentPosUrl, currentApiToken]) => {
				modal.innerHTML = `
									<h2 style="margin-top: 0; color: #333;">HCB PoS Configuration</h2>
									<div style="margin-bottom: 20px;">
											<label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">
													PoS Instance URL:
											</label>
											<input type="text" id="posUrl" placeholder="https://your-pos-instance.com" 
														value="${currentPosUrl}"
														style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
											<small style="color: #666;">The URL of your HCB PoS instance</small>
									</div>
									<div style="margin-bottom: 20px;">
											<label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">
													API Token:
											</label>
											<input type="password" id="apiToken" placeholder="Your API token" 
														value="${currentApiToken}"
														style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
											<small style="color: #666;">Your PoS API token</small>
									</div>
									<div style="display: flex; gap: 10px; justify-content: flex-end;">
											<button id="cancelBtn" style="padding: 8px 16px; border: 1px solid #ddd; background: gray; color: black; border-radius: 4px; cursor: pointer;">
													Cancel
											</button>
											<button id="saveBtn" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">
													Save & Link Token
											</button>
									</div>
							`;

				overlay.appendChild(modal);
				document.body.appendChild(overlay);

				// Handle button clicks
				document.getElementById('cancelBtn').onclick = () => {
					document.body.removeChild(overlay);
					resolve(null);
				};

				document.getElementById('saveBtn').onclick = () => {
					const posUrl = document.getElementById('posUrl').value.trim();
					const apiToken = document.getElementById('apiToken').value.trim();

					if (!posUrl || !apiToken) {
						alert('Please fill in both fields');
						return;
					}

					// Remove trailing slash from URL if present
					const cleanUrl = posUrl.replace(/\/$/, '');
					Promise.all([
						GM.setValue(CONFIG_KEYS.POS_URL, cleanUrl),
						GM.setValue(CONFIG_KEYS.API_TOKEN, apiToken)
					]);

					document.body.removeChild(overlay);
					resolve({ posUrl: cleanUrl, apiToken });
				};

				// Handle Enter key
				modal.addEventListener('keypress', (e) => {
					if (e.key === 'Enter') {
						document.getElementById('saveBtn').click();
					}
				});

				// Focus first input
				document.getElementById('posUrl').focus();
			});
		});
	}

	// Send token to PoS API
	function linkToken(sessionToken, posUrl, apiToken) {
		return new Promise((resolve, reject) => {
			GM.xmlHttpRequest({
				method: 'POST',
				url: `${posUrl}/api/link`,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiToken}`
				},
				data: JSON.stringify({
					sessionToken: sessionToken
				}),
				onload: function (response) {
					if (response.status === 200 || response.status === 201) {
						resolve(response);
					} else {
						reject(new Error(`HTTP ${response.status}: ${response.responseText}`));
					}
				},
				onerror: function (error) {
					reject(new Error('Network error occurred'));
				}
			});
		});
	}

	// Show success/error notification
	function showNotification(message, isError = false) {
		const notification = document.createElement('div');
		notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${isError ? 'rgba(132,146,166,.125)' : '#ec3750'};
            color: white;
            border-radius: 4px;
            z-index: 10001;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        `;
		notification.textContent = message;

		document.body.appendChild(notification);

		setTimeout(() => {
			if (notification.parentNode) {
				document.body.removeChild(notification);
			}
		}, 4000);
	}

	// Check if organization is already linked
	async function checkOrganizationLinked(posUrl, apiToken) {
		return new Promise((resolve, reject) => {
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', () => {
					resolve(checkOrganizationLinked(posUrl, apiToken));
				});
				return;
			}

			if (!posUrl || !apiToken) {
				resolve(false);
				return;
			}

			GM.xmlHttpRequest({
				method: 'GET',
				url: `${posUrl}/api/link`,
				headers: {
					Authorization: `Bearer ${apiToken}`
				},
				onload: function (response) {
					if (response.status === 200) {
						try {
							const data = JSON.parse(response.responseText);
							resolve(data.linked && data.hasSessionToken);
						} catch (error) {
							reject(new Error('Invalid response format'));
						}
					} else {
						reject(new Error(`HTTP ${response.status}: ${response.responseText}`));
					}
				},
				onerror: function (error) {
					reject(new Error('Network error occurred'));
				}
			});
		});
	}

	// Main function to link HCB token
	async function linkHCBToken() {
		try {
			// Get HCB session token
			const sessionToken = getHCBSessionToken();
			if (!sessionToken) {
				showNotification('Please log into HCB first!', true);
				return;
			}

			// Display the token in console (as requested)
			console.log(
				`%c ✨ Behold! Your HCB Auth Token! \n%c${sessionToken}`,
				'background-color: red; color: white; font-weight: 800;',
				'background-color: white; color: black;'
			);

			// Check if configuration exists
			let posUrl = await GM.getValue(CONFIG_KEYS.POS_URL, '');
			let apiToken = await GM.getValue(CONFIG_KEYS.API_TOKEN, '');

			// Show config modal if settings are missing
			if (!posUrl || !apiToken) {
				console.error('No configuration found for HCB PoS');
				return;
			}

			// Check if organization is already linked
			try {
				const isLinked = await checkOrganizationLinked(posUrl, apiToken);
				if (!isLinked) {
					// Show config modal to confirm the setup
					showNotification('No organization linked. Please confirm your configuration.', true);
					const config = await showConfigModal();
					if (!config) {
						showNotification('Configuration cancelled', true);
						return;
					}
					posUrl = config.posUrl;
					apiToken = config.apiToken;
				}
			} catch (error) {
				console.warn('Could not check organization status:', error);
				// Continue anyway - might be first time setup or network issue
			}

			// Link the token
			showNotification('Linking token to PoS...', false);

			await linkToken(sessionToken, posUrl, apiToken);

			showNotification('Token linked successfully!', false);
		} catch (error) {
			console.error('Error linking token:', error);
			showNotification(`Error: ${error.message}`, true);
		}
	}

	// Add hover menu to HCB interface
	function addHoverMenu() {
		// Wait for page to load
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', addHoverMenu);
			return;
		}

		// Create hover trigger area
		const hoverTrigger = document.createElement('div');
		hoverTrigger.style.cssText = `
            position: fixed;
            bottom: 0;
            right: 0;
            width: 80px;
            height: 80px;
            z-index: 9998;
            pointer-events: auto;
        `;

		// Create menu container
		const menuContainer = document.createElement('div');
		menuContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
            pointer-events: none;
            z-index: 9999;
        `;

		// Create link button
		const linkButton = document.createElement('button');
		linkButton.innerHTML = 'Link to PoS';
		linkButton.style.cssText = `
            padding: 12px 16px;
            background: #ec3750;
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
            transition: all 0.2s ease;
            pointer-events: auto;
            white-space: nowrap;
        `;

		// Create settings button
		const settingsButton = document.createElement('button');
		settingsButton.innerHTML = 'Settings';
		settingsButton.style.cssText = `
            padding: 12px 16px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
            transition: all 0.2s ease;
            pointer-events: auto;
            white-space: nowrap;
        `;

		// Add hover effects for buttons
		linkButton.onmouseenter = () => {
			linkButton.style.transform = 'scale(1.05)';
			linkButton.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
		};

		linkButton.onmouseleave = () => {
			linkButton.style.transform = 'scale(1)';
			linkButton.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.3)';
		};

		settingsButton.onmouseenter = () => {
			settingsButton.style.transform = 'scale(1.05)';
			settingsButton.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
		};

		settingsButton.onmouseleave = () => {
			settingsButton.style.transform = 'scale(1)';
			settingsButton.style.boxShadow = '0 2px 8px rgba(108, 117, 125, 0.3)';
		};

		// Add click handlers
		linkButton.onclick = linkHCBToken;
		settingsButton.onclick = async () => {
			const config = await showConfigModal();
			if (config) {
				showNotification('Configuration updated!', false);
			}
		};

		// Append buttons to menu
		menuContainer.appendChild(linkButton);
		menuContainer.appendChild(settingsButton);

		// Show/hide menu on hover
		let hoverTimeout;

		function showMenu() {
			clearTimeout(hoverTimeout);
			menuContainer.style.opacity = '1';
			menuContainer.style.transform = 'translateY(0)';
			menuContainer.style.pointerEvents = 'auto';
		}

		function hideMenu() {
			hoverTimeout = setTimeout(() => {
				menuContainer.style.opacity = '0';
				menuContainer.style.transform = 'translateY(10px)';
				menuContainer.style.pointerEvents = 'none';
			}, 200);
		}

		// Add event listeners
		hoverTrigger.onmouseenter = showMenu;
		hoverTrigger.onmouseleave = hideMenu;
		menuContainer.onmouseenter = showMenu;
		menuContainer.onmouseleave = hideMenu;

		// Append to document
		document.body.appendChild(hoverTrigger);
		document.body.appendChild(menuContainer);
	}

	// Initialize the userscript
	function init() {
		addHoverMenu();

		// Also add keyboard shortcut (Ctrl+Shift+L)
		document.addEventListener('keydown', (e) => {
			if (e.ctrlKey && e.shiftKey && e.key === 'L') {
				e.preventDefault();
				linkHCBToken();
			}
		});

		// check if the point of sale can be linked
		Promise.all([
			GM.getValue(CONFIG_KEYS.POS_URL, ''),
			GM.getValue(CONFIG_KEYS.API_TOKEN, ''),
			GM.getValue('lastLinkedTime', 0)
		]).then(([posUrl, apiToken, lastLinkedTime]) => {
			checkOrganizationLinked(posUrl, apiToken).then((canAuthorize) => {
				if (!canAuthorize) {
					showNotification('No organization linked.', true);
					showConfigModal().then((config) => {
						if (config) {
							showNotification('Configuration updated!', false);
							linkHCBToken().then(() => {
								GM.setValue('lastLinkedTime', Date.now());
							});
						}
					});
				}
			});
			// check if it's been > 30 minutes, and if so, automatically link the token
			const timeDiff = Date.now() - lastLinkedTime;
			if (timeDiff > 30 * 60 * 1000) {
				linkHCBToken().then(() => {
					GM.setValue('lastLinkedTime', Date.now());
				});
			}
		});
	}

	// Start the script
	init();
})();
