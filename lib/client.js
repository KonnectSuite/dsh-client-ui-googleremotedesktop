window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-googleremotedesktop",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/locales.ts
		/** Copy owned by the Google Remote Desktop page. */
		/** Locale namespace this page registers its dictionaries under. */
		const NS = "googleRemoteDesktop";
		/** Chinese copy. */
		const zh = {
			title: "Google 远程桌面",
			back: "后退",
			forward: "前进",
			reload: "重新加载",
			computers: "我的电脑",
			support: "远程支持",
			"load.failed": "页面加载失败；请重新加载。",
			"load.signin": "若持续失败，请先登录 AryaAI：持久登录需要账户。",
			"load.hint": "正在载入 Google 远程桌面…"
		};
		/** English copy, same keys. */
		const en = {
			title: "Google Remote Desktop",
			back: "Back",
			forward: "Forward",
			reload: "Reload",
			computers: "My computers",
			support: "Remote support",
			"load.failed": "The page could not load; reload and try again.",
			"load.signin": "If this persists, sign in to AryaAI: a persistent guest needs an account.",
			"load.hint": "Loading Google Remote Desktop…"
		};
		//#endregion
		//#region src/client/styles.ts
		/**
		* Page styles, injected once per document.
		*
		* The bundle is built standalone, so it carries its own stylesheet instead of
		* going through the monorepo's CSS-modules pipeline: {@link installStyles} adds
		* one `data-plugin-css` tag the way the harness preset does for every other
		* client plugin, which keeps this page's styles owned, inspectable and
		* removable on the same terms. Every value comes from the shell's theme tokens,
		* so the page follows the active theme and needs no light/dark pair.
		*/
		/** Class names used by the page. */
		const classes = {
			page: "grd-page",
			overlay: "grd-overlay",
			toolbar: "grd-toolbar",
			action: "grd-action",
			separator: "grd-separator",
			title: "grd-title",
			status: "grd-status",
			viewport: "grd-viewport",
			error: "grd-error"
		};
		/** Stable style-tag identity for this package, also used to detect a second install. */
		const STYLE_TAG_ID = "@deepseek-ai/dsh-client-ui-googleremotedesktop/page.css";
		/**
		* The overlay borrows the shell's own main-column bounds
		* (`--dsh-main-left` / `--dsh-main-right`) so the guest covers exactly the area
		* the Conversation would occupy, and stays put while panels and Sessions change.
		*/
		const css = `
.${classes.page}{flex:1;min-height:0;background:var(--dsw-alias-bg-base)}
.${classes.overlay}{position:absolute;top:0;bottom:0;left:var(--dsh-main-left);right:var(--dsh-main-right);z-index:1;display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-base);visibility:hidden;pointer-events:none}
/* The overlay layer spans the whole frame, which on Windows includes the
   Electron caption strip above every panel (the frame is padded by it, so the
   centre column starts below). Landing the overlay at the frame's top therefore
   paints this page over the window's caption row and puts this toolbar on the
   row the shell's own header owns. Offset by the same strip the centre column is
   offset by; the figure is declared only under this attribute, so every other
   platform keeps the rule above unchanged. */
[data-windows-titlebar] .${classes.overlay}{top:var(--dsh-windows-titlebar-height)}
.${classes.overlay}[data-active]{visibility:visible;pointer-events:auto}
.${classes.toolbar}{height:42px;flex:none;display:flex;align-items:center;gap:6px;padding:0 12px;border-bottom:1px solid var(--dsw-alias-border-l3)}
.${classes.toolbar} button{display:grid;place-items:center;width:28px;height:28px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer}
.${classes.toolbar} button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.${classes.toolbar} button:disabled{opacity:.4;cursor:default}
.${classes.toolbar} button.${classes.action}{width:auto;padding:0 10px;font:inherit;font-size:12px;white-space:nowrap}
.${classes.title}{margin-left:8px;color:var(--dsw-alias-label-primary);font-weight:600}
.${classes.separator}{flex:1}
.${classes.status}{color:var(--dsw-alias-label-secondary);font-size:12px}
.${classes.viewport}{flex:1;min-height:0}
.${classes.error}{margin:0;padding:8px 12px;color:var(--dsw-alias-state-error-primary)}
`;
		/**
		* Add this page's stylesheet to the document, once.
		* Called at bundle materialization: every module-scope side effect of a client
		* bundle runs when its factory is first materialized, not at script execution.
		*/
		function installStyles() {
			if (typeof document === "undefined") return;
			if (document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_TAG_ID)}]`) !== null) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-googleremotedesktop";
			tag.dataset.pluginCss = STYLE_TAG_ID;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/GoogleRemoteDesktop.tsx
		/**
		* The page itself: a left-rail icon, the main-panel seat it addresses, and the
		* retained Desktop guest that shows Google Remote Desktop.
		*/
		installStyles();
		/** The global page identity shared by the left rail row and the main-panel seat. */
		const PANEL_ID = "google-remote-desktop";
		/** Google Remote Desktop entry points, in the order the toolbar offers them. */
		const DESTINATIONS = {
			/** The signed-in machine list and the way into a session. */
			computers: "https://remotedesktop.google.com/access",
			/** Give someone else access to this machine. */
			support: "https://remotedesktop.google.com/support"
		};
		/** Storage account key: one account-scoped partition for this application page. */
		const WORKSPACE_KEY = "global:google-remote-desktop";
		/** Partition namespace; the provider derives the persistent partition from it. */
		const STORAGE_NAMESPACE = "google-remote-desktop";
		/**
		* How long a reload request may go unanswered before the guest is replaced.
		* A carrier that accepts the request publishes loading state in the same turn,
		* so this only ever elapses when the request was refused outright.
		*/
		const RELOAD_REFUSAL_MS = 300;
		/** A monitor with a remote-arrow mark: readable at 16-18px in the rail. */
		function GoogleRemoteDesktopIcon({ size }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.7,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				focusable: "false",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						x: "2.5",
						y: "3.5",
						width: "19",
						height: "13",
						rx: "2"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8.5 20.5h7" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 16.5v4" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9 8.75h6" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12.75 6.5 15 8.75l-2.25 2.25" })
				]
			});
		}
		/** Main-panel seat. The guest is mounted by the overlay, which outlives this occupant. */
		function GoogleRemoteDesktopPanel({ t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("main", {
				"aria-label": t("title"),
				className: classes.page
			});
		}
		/**
		* Keep one Google Remote Desktop guest connected while Sessions and main panels
		* change. The guest is created the first time this panel is opened and is then
		* retained, so switching away and back does not reload the remote session.
		*/
		function GoogleRemoteDesktopOverlay({ browserPages, t, usePanelInfo }) {
			const active = usePanelInfo((info) => info.activePanelId === PANEL_ID);
			const viewportId = (0, react.useId)();
			const page = (0, react.useRef)(null);
			const [frame, setFrame] = (0, react.useState)(() => browserPages.emptyFrame());
			const [opened, setOpened] = (0, react.useState)(false);
			/** Bumped to retire a guest the carrier would not reload and stand up its replacement. */
			const [generation, setGeneration] = (0, react.useState)(0);
			/** Address a replacement guest must come back to; the first guest opens the entry point. */
			const resume = (0, react.useRef)(void 0);
			const refusal = (0, react.useRef)(void 0);
			(0, react.useEffect)(() => {
				if (active) setOpened(true);
			}, [active]);
			(0, react.useEffect)(() => {
				if (!opened) return void 0;
				const created = browserPages.createDesktopPage({
					initial: void 0,
					storage: STORAGE_NAMESPACE,
					persist: () => {},
					openRequested: (url) => {
						const target = resolve(browserPages, url);
						if (target !== void 0) created.frame.loadUrl(target);
					}
				}, WORKSPACE_KEY);
				page.current = created;
				const unmount = created.presentation.mount(viewportId);
				const unsubscribe = created.frame.subscribe(() => {
					setFrame(created.frame.getSnapshot());
				});
				const destination = resume.current ?? resolve(browserPages, DESTINATIONS.computers);
				resume.current = void 0;
				if (destination !== void 0) created.frame.loadUrl(destination);
				return () => {
					unsubscribe();
					unmount();
					page.current = null;
					created.frame.dispose();
				};
			}, [
				browserPages,
				viewportId,
				opened,
				generation
			]);
			(0, react.useEffect)(() => () => {
				window.clearTimeout(refusal.current);
			}, []);
			/**
			* Reload the page on screen.
			*
			* The Desktop carrier answers a same-address reload with `<webview>.reload()`,
			* but returns silently — publishing no state at all — when it cannot act: no
			* address, no guest element, or an aborted lifetime. A click that publishes
			* nothing is indistinguishable from a broken button, so a snapshot that has
			* not moved by the next turn is read as a refusal and answered by retiring the
			* guest and standing up its replacement, which navigates for real. With no
			* address on screen there is nothing to reload, so the entry point is opened
			* again rather than doing nothing.
			*/
			const reload = () => {
				const created = page.current;
				if (created === null) return;
				const before = created.frame.getSnapshot();
				if (before.target === void 0) {
					navigate(created, browserPages, DESTINATIONS.computers);
					return;
				}
				created.frame.reload();
				window.clearTimeout(refusal.current);
				refusal.current = window.setTimeout(() => {
					if (page.current?.frame.getSnapshot() !== before) return;
					resume.current = before.target;
					setGeneration((current) => current + 1);
				}, RELOAD_REFUSAL_MS);
			};
			const destination = (url) => () => {
				const current = page.current;
				if (current !== null) navigate(current, browserPages, url);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: classes.overlay,
				"data-active": active || void 0,
				"aria-hidden": !active,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: classes.toolbar,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": t("back"),
								disabled: !frame.canGoBack,
								onClick: () => {
									page.current?.frame.goBack();
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutlineRegular, {})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": t("forward"),
								disabled: !frame.canGoForward,
								onClick: () => {
									page.current?.frame.goForward();
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutlineRegular, {})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": t("reload"),
								onClick: reload,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutlineRegular, {})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: classes.title,
								children: t("title")
							}),
							frame.loading && frame.error === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: classes.status,
								children: t("load.hint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: classes.separator }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: classes.action,
								onClick: destination(DESTINATIONS.computers),
								children: t("computers")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: classes.action,
								onClick: destination(DESTINATIONS.support),
								children: t("support")
							})
						]
					}),
					frame.error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: classes.error,
						role: "status",
						children: [
							t("load.failed"),
							" ",
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: classes.status,
								children: t("load.signin")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						id: viewportId,
						className: classes.viewport,
						"aria-label": t("title")
					})
				]
			});
		}
		/** Validate one address with the provider's fixed policy. */
		function resolve(browserPages, url) {
			const parsed = browserPages.parseAddress(url, window.location.origin);
			return parsed.ok ? parsed.target : void 0;
		}
		/** Load a Google Remote Desktop entry point in the existing guest. */
		function navigate(page, browserPages, url) {
			const target = resolve(browserPages, url);
			if (target !== void 0) page.frame.loadUrl(target);
		}
		//#endregion
		//#region src/client/index.ts
		/**
		* Services needed before anything is registered: the slot registry and copy.
		* `browserPages` and the layout service are injected inside `apply`, because a
		* profile without the Desktop provider (a Web profile) must leave this page
		* inert rather than fail its fiber.
		*/
		const inject = ["slots", "locale"];
		/**
		* Register the icon, the main-panel seat and the guest overlay.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.inject(["browserPages"], (scope) => {
				const t = scope.locale.bind(NS);
				scope.effect(() => scope.locale.register(NS, {
					zh,
					en
				}), "ui-googleremotedesktop.copy");
				scope.slots.inject("main", () => scope.slots.register({
					name: "main",
					key: PANEL_ID,
					locale: NS
				}, GoogleRemoteDesktopPanel));
				scope.slots.inject("sidebar.panellist", () => scope.slots.register({
					name: "sidebar.panellist",
					id: PANEL_ID,
					order: -8,
					locale: NS,
					label: () => t("title")
				}, GoogleRemoteDesktopIcon));
				scope.slots.inject("shell.overlay", () => scope.slots.register({
					name: "shell.overlay",
					id: PANEL_ID,
					locale: NS,
					inject: () => ({ browserPages: scope.browserPages })
				}, GoogleRemoteDesktopOverlay));
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map