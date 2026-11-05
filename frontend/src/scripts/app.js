(() => {
    const themeKey = "jobpilot-theme", scaleKey = "jobpilot-scale";
    const accountStateKey = "jobpilot-current-account", recentAccountsKey = "jobpilot-recent-accounts";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = preference => {
        const resolved = preference === "system" ? (systemTheme.matches ? "dark" : "light") : preference;
        document.documentElement.dataset.theme = resolved;
        const themeSelect = document.querySelector("#themeSelect"); if (themeSelect) themeSelect.value = preference;
    };
    const themePreference = localStorage.getItem(themeKey) || "system";
    const scalePreference = localStorage.getItem(scaleKey) || "1";
    const defaultAccount = { id: "jordan.davis@example.com", name: "Jordan Davis", email: "jordan.davis@example.com" };
    let currentAccount = localStorage.getItem(accountStateKey) === null ? defaultAccount : JSON.parse(localStorage.getItem(accountStateKey));
    let recentAccounts = JSON.parse(localStorage.getItem(recentAccountsKey) || "null") || [defaultAccount];
    if (localStorage.getItem(accountStateKey) === null) localStorage.setItem(accountStateKey, JSON.stringify(currentAccount));
    if (!localStorage.getItem(recentAccountsKey)) localStorage.setItem(recentAccountsKey, JSON.stringify(recentAccounts));
    applyTheme(themePreference);
    document.documentElement.style.setProperty("--ui-scale", scalePreference);
    const viewRoot = document.querySelector("#view-root");
    const pageTitle = document.querySelector("[data-page-title]");
    const titles = { overview: "Overview", applications: "Applications", interviews: "Interviews", search: "Job search" };
    const statusClass = { Saved: "status-saved", Applied: "status-applied", Interviewing: "status-interview", Offer: "status-offer" };
    const appKey = "jobpilot-applications", deletedKey = "jobpilot-deleted-applications", overridesKey = "jobpilot-application-overrides", interviewKey = "jobpilot-interviews";
    const initialInterviews = [
        { id: "linear-2026-11-02", date: "2026-11-02", time: "10:30", company: "Linear", role: "Product Designer", type: "First round", status: "Scheduled" },
        { id: "notion-2026-11-04", date: "2026-11-04", time: "14:00", company: "Notion", role: "Senior UX Designer", type: "Portfolio review", status: "Scheduled" },
        { id: "vercel-2026-11-06", date: "2026-11-06", time: "11:00", company: "Vercel", role: "Product Designer", type: "Hiring manager", status: "Scheduled" }
    ];
    const readInterviews = () => JSON.parse(localStorage.getItem(interviewKey) || "null") || initialInterviews;
    const saveInterviews = list => localStorage.setItem(interviewKey, JSON.stringify(list));

    async function renderRoute() {
        const route = (location.hash.slice(1) || "overview").toLowerCase();
        const page = Object.hasOwn(titles, route) ? route : "overview";
        document.querySelectorAll("[data-route]").forEach(link => link.classList.toggle("active", link.dataset.route === page));
        if (pageTitle) pageTitle.textContent = titles[page];
        document.title = `${titles[page]} · JobPilot`;
        try {
            const response = await fetch(`components/${page}.html`);
            if (!response.ok) throw new Error("Component request failed");
            viewRoot.innerHTML = await response.text();
            initializeView(page);
        }
        catch {
            viewRoot.innerHTML = "<div class=\"page-content\"><section class=\"panel\" style=\"padding:24px\"><h2>Page could not load</h2><p class=\"page-subtitle\">Please open JobPilot through a local web server so its components can be loaded.</p></section></div>";
        }
    }

    function createApplicationRow(item) {
        const row = document.createElement("tr"); row.dataset.status = item.status; row.dataset.company = item.company; row.dataset.role = item.role; row.dataset.id = item.id || ""; row.dataset.created = item.created || "";
        const companyCell = document.createElement("td"), wrap = document.createElement("div"); wrap.className = "company-cell";
        const logo = document.createElement("div"); logo.className = `company-logo ${companyLogoClass(item.company)}`; logo.textContent = (item.company || "?").slice(0, 1).toUpperCase();
        const copy = document.createElement("div"), company = document.createElement("strong"), role = document.createElement("span"); company.textContent = item.company; role.textContent = item.role;
        copy.append(company, role); wrap.append(logo, copy); companyCell.append(wrap);
        const statusCell = document.createElement("td"), badge = document.createElement("span"); badge.className = `status ${statusClass[item.status] || "status-saved"}`; badge.textContent = item.status; statusCell.append(badge);
        const dateCell = document.createElement("td"); dateCell.className = "muted-cell"; dateCell.textContent = new Date(item.created || Date.now()).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
        const locationCell = document.createElement("td"); locationCell.className = "muted-cell"; locationCell.textContent = "—";
        const actionCell = document.createElement("td"); actionCell.append(makeEditButton(), makeDeleteButton("application"));
        row.append(companyCell, statusCell, dateCell, locationCell, actionCell); return row;
    }
    function companyLogoClass(company) {
        const palettes = 8;
        const hash = [...String(company || "")].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
        return `logo-dynamic-${hash % palettes}`;
    }
    function makeDeleteButton(type) {
        const button = document.createElement("button"); button.className = "delete-button"; button.type = "button"; button.dataset.delete = type; button.setAttribute("aria-label", `Delete ${type}`); button.title = `Delete ${type}`; button.textContent = "×"; return button; 
    }
    function makeEditButton() {
        const button = document.createElement("button"); button.className = "edit-button"; button.type = "button"; button.dataset.editApplication = ""; button.setAttribute("aria-label", "Edit application"); button.title = "Edit application"; button.textContent = "✎"; return button;
    }
    function isoDateFromLabel(value) {
        const match = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(value.trim());
        if (!match) return "";
        const months = { Jan:"01", Feb:"02", Mar:"03", Apr:"04", May:"05", Jun:"06", Jul:"07", Aug:"08", Sep:"09", Oct:"10", Nov:"11", Dec:"12" };
        const [, day, month, year] = match;
        return months[month] ? `${year}-${months[month]}-${day.padStart(2, "0")}` : "";
    }
    function updateApplicationRow(row, item) {
        row.dataset.company = item.company; row.dataset.role = item.role; row.dataset.status = item.status; row.dataset.created = item.created || "";
        const logo = row.querySelector(".company-logo"); logo.className = `company-logo ${companyLogoClass(item.company)}`; logo.textContent = (item.company || "?").slice(0, 1).toUpperCase();
        row.querySelector(".company-cell strong").textContent = item.company; row.querySelector(".company-cell span").textContent = item.role;
        const badge = row.querySelector(".status"); badge.className = `status ${statusClass[item.status] || "status-saved"}`; badge.textContent = item.status;
        if (item.created) row.querySelectorAll("td")[2].textContent = new Date(item.created).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
    }

    function initializeView(page) {
        if (page === "applications") {
            const tbody = viewRoot.querySelector(".full-table tbody");
            const removed = JSON.parse(localStorage.getItem(deletedKey) || "[]");
            const overrides = JSON.parse(localStorage.getItem(overridesKey) || "{}");
            tbody?.querySelectorAll("tr").forEach(row => {
                const baseCompany = row.querySelector(".company-cell strong")?.textContent;
                const baseRole = row.querySelector(".company-cell span")?.textContent;
                const sampleId = `${baseCompany}::${baseRole}`;
                const override = overrides[sampleId];
                if (override) updateApplicationRow(row, override);
                const company = row.querySelector(".company-cell strong")?.textContent;
                const role = row.querySelector(".company-cell span")?.textContent;
                if (removed.includes(`${company}::${role}`)) row.remove();
                else {
                    row.dataset.company = company; row.dataset.role = role; row.dataset.sampleId = sampleId; row.dataset.id = `sample:${sampleId}`;
                    row.dataset.created = override?.created || isoDateFromLabel(row.querySelectorAll("td")[2]?.textContent || "");
                    row.lastElementChild?.append(makeEditButton(), makeDeleteButton("application")); 
                }
            });
            JSON.parse(localStorage.getItem(appKey) || "[]").forEach(item => tbody?.prepend(createApplicationRow(item)));
            const rows = [...viewRoot.querySelectorAll(".full-table tbody tr")];
            const search = viewRoot.querySelector("[data-filter-input]"), select = viewRoot.querySelector("[data-status-filter]"), count = viewRoot.querySelector("[data-visible-count]"), empty = viewRoot.querySelector("[data-empty-state]");
            const filter = () => {
                const term = (search?.value || "").trim().toLowerCase(), status = select?.value || "all"; let shown = 0; rows.forEach(row => {
                    row.hidden = !(row.textContent.toLowerCase().includes(term) && (status === "all" || row.dataset.status === status)); if (!row.hidden) shown++;
                }); if (count) count.textContent = String(shown); if (empty) empty.hidden = shown > 0; 
            };
            search?.addEventListener("input", filter); select?.addEventListener("change", filter);
        }
        if (page === "search") viewRoot.querySelectorAll(".save-button").forEach(button => button.addEventListener("click", () => {
            const saved = button.classList.toggle("is-saved"); button.textContent = saved ? "♥" : "♡"; button.setAttribute("aria-label", saved ? "Remove saved job" : "Save job"); 
        }));
        if (page === "interviews") initializeCalendar();
    }

    let calendarMonth, selectedDate;
    function initializeCalendar() {
        const now = new Date(); calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1); selectedDate = dateKey(now);
        renderCalendar();
        viewRoot.querySelectorAll("[data-month-shift]").forEach(button => button.addEventListener("click", () => {
            calendarMonth.setMonth(calendarMonth.getMonth() + Number(button.dataset.monthShift)); renderCalendar(); 
        }));
        viewRoot.querySelector("[data-add-selected]")?.addEventListener("click", () => openInterviewModal(selectedDate));
    }
    function dateKey(date) {
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 10); 
    }
    function renderCalendar() {
        const grid = viewRoot.querySelector("[data-calendar-grid]"); if (!grid) return;
        const monthLabel = viewRoot.querySelector("[data-calendar-month]");
        monthLabel.textContent = calendarMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        grid.replaceChildren();
        ["MON","TUE","WED","THU","FRI","SAT","SUN"].forEach(day => {
            const el = document.createElement("div"); el.className = "calendar-weekday"; el.textContent = day; grid.append(el); 
        });
        const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
        const startOffset = (first.getDay() + 6) % 7;
        const start = new Date(first); start.setDate(first.getDate() - startOffset);
        const interviews = readInterviews();
        for (let i = 0; i < 42; i++) {
            const date = new Date(start); date.setDate(start.getDate() + i); const key = dateKey(date);
            const button = document.createElement("button"); button.type = "button"; button.className = "calendar-day"; button.textContent = String(date.getDate());
            if (date.getMonth() !== calendarMonth.getMonth()) button.classList.add("faint");
            if (key === selectedDate) button.classList.add("selected-day");
            const dayEvents = interviews.filter(item => item.date === key && item.status !== "Cancelled");
            if (dayEvents.length) {
                const dot = document.createElement("i"); dot.className = `event-dot ${dayEvents.some(e => e.status === "Completed") ? "event-green" : dayEvents.some(e => e.status === "Needs reschedule") ? "event-purple" : "event-blue"}`; button.append(dot); 
            }
            button.addEventListener("click", () => {
                selectedDate = key; renderCalendar(); renderAgenda(); 
            }); grid.append(button);
        }
        renderAgenda();
    }
    function renderAgenda() {
        const list = viewRoot.querySelector("[data-agenda-list]"); if (!list) return;
        const dateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        viewRoot.querySelector("[data-agenda-title]").textContent = dateLabel;
        const events = readInterviews().filter(item => item.date === selectedDate).sort((a,b) => a.time.localeCompare(b.time));
        viewRoot.querySelector("[data-agenda-subtitle]").textContent = events.length ? `${events.length} interview${events.length === 1 ? "" : "s"} scheduled` : "Nothing planned yet. Add an interview for this date.";
        list.replaceChildren();
        if (!events.length) {
            const empty = document.createElement("div"); empty.className = "agenda-empty"; empty.innerHTML = "<span class=\"empty-calendar-icon\">＋</span><strong>A little space in your calendar.</strong><span>Add an interview whenever you are ready.</span>"; list.append(empty); return; 
        }
        const classes = { Scheduled:"status-applied", Completed:"status-offer", Cancelled:"status-saved", "Needs reschedule":"status-review" };
        events.forEach(item => {
            const card = document.createElement("article"); card.className = "interview-detail";
            const logo = document.createElement("div"); logo.className = "company-logo logo-linear"; logo.textContent = item.company.slice(0,1).toUpperCase();
            const content = document.createElement("div"); content.className = "detail-content";
            const top = document.createElement("div"); top.className = "detail-top"; const title = document.createElement("strong"); title.textContent = item.role;
            const badge = document.createElement("span"); badge.className = `status ${classes[item.status] || "status-applied"}`; badge.textContent = item.type; top.append(title,badge);
            const company = document.createElement("span"); company.className = "detail-company"; company.textContent = `${item.company} · ${item.status}`;
            const meta = document.createElement("div"); meta.className = "detail-meta"; const time = document.createElement("span"); time.textContent = `◷  ${formatTime(item.time)}`; meta.append(time);
            const actions = document.createElement("div"); actions.className = "detail-actions";
            const label = document.createElement("label"); label.className = "interview-status-label"; label.textContent = "Status";
            const select = document.createElement("select"); select.className = "filter-select interview-status-select"; select.setAttribute("aria-label", `Status for ${item.company} ${item.role}`);
            ["Scheduled","Completed","Cancelled","Needs reschedule"].forEach(status => {
                const option = document.createElement("option"); option.value = status; option.textContent = status; option.selected = status === item.status; select.append(option); 
            });
            select.addEventListener("change", () => {
                const all = readInterviews(); const found = all.find(e => e.id === item.id); if (found) found.status = select.value; saveInterviews(all); renderCalendar(); 
            });
            actions.append(label, select, makeDeleteButton("interview")); card.append(logo,content); content.append(top,company,meta,actions); card.dataset.interviewId = item.id; list.append(card);
        });
    }
    function formatTime(value) {
        const [hour, minute] = value.split(":").map(Number); return new Date(2000,0,1,hour,minute).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hourCycle:"h23"}); 
    }

    const appModal = document.querySelector("#applicationModal"), interviewModal = document.querySelector("#interviewModal");
    const accountModal = document.querySelector("#accountModal"), settingsModal = document.querySelector("#settingsModal");
    const recentAccountsModal = document.querySelector("#recentAccountsModal"), accountMenu = document.querySelector("#accountMenu");
    let editingApplication = null;
    function resetApplicationEditor() {
        editingApplication = null;
        document.querySelector("#modalTitle").textContent = "Add an application";
        document.querySelector("#applicationForm [type=submit]").innerHTML = "Add to pipeline <span>→</span>";
    }
    function openApplicationEditor(row) {
        const form = document.querySelector("#applicationForm");
        editingApplication = { row, id: row.dataset.id, sampleId: row.dataset.sampleId || "" };
        form.elements.company.value = row.dataset.company;
        form.elements.role.value = row.dataset.role;
        form.elements.status.value = row.dataset.status;
        form.elements.date.value = row.dataset.created ? row.dataset.created.slice(0, 10) : "";
        document.querySelector("#modalTitle").textContent = "Edit application";
        form.querySelector("[type=submit]").innerHTML = "Save changes <span>→</span>";
        showModal(appModal);
    }
    function renderAccountState() {
        const initials = currentAccount ? currentAccount.name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() : "?";
        document.querySelectorAll(".account-trigger").forEach(button => {
            button.textContent = initials; button.setAttribute("aria-label", currentAccount ? `Account: ${currentAccount.name}` : "Account menu"); 
        });
        const name = document.querySelector(".profile-copy strong"), detail = document.querySelector(".profile-copy span");
        if (name) name.textContent = currentAccount?.name || "Signed out";
        if (detail) detail.textContent = currentAccount?.email || "No active account";
        localStorage.setItem(accountStateKey, JSON.stringify(currentAccount));
    }
    function openAccountMenu() {
        const item = (action, label, path) => `<button role="menuitem" data-account-action="${action}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg><span>${label}</span></button>`;
        accountMenu.innerHTML = currentAccount
            ? `<div class="account-menu-heading"><strong>${escapeText(currentAccount.name)}</strong><span>${escapeText(currentAccount.email)}</span></div>${item("logout", "Log Out", "M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6")}${item("add", "Add Account", "M12 5v14m-7-7h14")}${item("change", "Change Account", "M16 17l5-5-5-5M8 7l-5 5 5 5m13-5H3")}`
            : `<div class="account-menu-heading"><strong>Signed out</strong><span>Choose how to continue</span></div>${item("login", "Log In", "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4m-7-4 5-5-5-5m5 5H3")}${item("recent", "Choose a Recent Account", "M20 7v5h-5M20 12a8 8 0 1 1-2.3-5.7L20 7")}${item("register", "Registration", "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8m10 8v6m-3-3h6")}`;
        accountMenu.hidden = false;
    }
    function escapeText(value) {
        const el = document.createElement("span"); el.textContent = value; return el.innerHTML; 
    }
    function setAuthMode(mode) {
        const register = mode === "register", form = document.querySelector("#accountForm");
        document.querySelectorAll("[data-auth-mode]").forEach(tab => {
            const active = tab.dataset.authMode === mode; tab.classList.toggle("is-active", active); tab.setAttribute("aria-selected", String(active)); 
        });
        form.querySelector("[data-name-field]").hidden = !register; form.elements.name.required = register;
        form.elements.password.autocomplete = register ? "new-password" : "current-password";
        document.querySelector("#accountTitle").textContent = register ? "Create your account" : "Welcome back";
        document.querySelector("[data-auth-submit]").innerHTML = `${register ? "Create account" : "Log in"} <span>→</span>`;
        form.querySelector(".auth-message").textContent = register ? "Create a local preview profile. Account services are not connected yet." : "This login form is a local interface preview; no account service is connected.";
        form.reset(); form.querySelector("[data-name-field]").hidden = !register;
    }
    function rememberAccount(account) {
        recentAccounts = [account, ...recentAccounts.filter(item => item.email.toLowerCase() !== account.email.toLowerCase())].slice(0, 5);
        localStorage.setItem(recentAccountsKey, JSON.stringify(recentAccounts));
    }
    function openRecentAccounts() {
        const list = document.querySelector("#recentAccountList"); list.replaceChildren();
        if (!recentAccounts.length) {
            list.textContent = "No recent accounts yet."; 
        }
        recentAccounts.forEach(account => {
            const row = document.createElement("div"); row.className = "recent-account-option";
            const initials = account.name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
            const avatar = document.createElement("span"); avatar.className = "recent-account-avatar"; avatar.textContent = initials;
            const choose = document.createElement("button"); choose.type = "button"; choose.className = "recent-account-choice"; choose.dataset.recentEmail = account.email;
            const copy = document.createElement("span"), name = document.createElement("strong"), email = document.createElement("small"); name.textContent = account.name; email.textContent = account.email; copy.append(name, email); choose.append(avatar, copy);
            const remove = document.createElement("button"); remove.type = "button"; remove.className = "recent-account-delete"; remove.dataset.deleteAccount = account.email; remove.setAttribute("aria-label", `Remove ${account.name} from recent accounts`); remove.title = "Remove account"; remove.innerHTML = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3\"/></svg>";
            row.append(choose, remove); list.append(row);
        });
        showModal(recentAccountsModal);
    }
    function showModal(modal) {
        modal.classList.add("is-open"); modal.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden"; modal.querySelector("input")?.focus(); 
    }
    function hideModal(modal) {
        modal.classList.remove("is-open"); modal.setAttribute("aria-hidden","true"); document.body.style.overflow=""; 
    }
    function openInterviewModal(date) {
        const input = document.querySelector("[data-interview-date]"); if (input) input.value = date; showModal(interviewModal); 
    }

    document.addEventListener("click", event => {
        if (event.target.closest("[data-open-modal]")) {
            resetApplicationEditor(); document.querySelector("#applicationForm").reset(); showModal(appModal); 
        }
        const editApplication = event.target.closest("[data-edit-application]");
        if (editApplication) {
            openApplicationEditor(editApplication.closest("tr")); return; 
        }
        const accountTrigger = event.target.closest("[data-open-account], .profile-menu");
        if (accountTrigger) {
            event.preventDefault(); openAccountMenu(); return; 
        }
        if (event.target.closest("[data-account-action]")) {
            const action = event.target.closest("[data-account-action]").dataset.accountAction; accountMenu.hidden = true;
            if (action === "logout") {
                currentAccount = null; renderAccountState(); 
            }
            if (action === "login" || action === "add" || action === "register") {
                setAuthMode(action === "register" || action === "add" ? "register" : "login"); showModal(accountModal); 
            }
            if (action === "change" || action === "recent") openRecentAccounts();
            return;
        }
        const recentChoice = event.target.closest("[data-recent-email]");
        if (recentChoice) {
            currentAccount = recentAccounts.find(account => account.email === recentChoice.dataset.recentEmail) || null; renderAccountState(); hideModal(recentAccountsModal); return; 
        }
        const deleteRecent = event.target.closest("[data-delete-account]");
        if (deleteRecent) {
            const email = deleteRecent.dataset.deleteAccount;
            recentAccounts = recentAccounts.filter(account => account.email !== email);
            localStorage.setItem(recentAccountsKey, JSON.stringify(recentAccounts));
            if (currentAccount?.email === email) {
                currentAccount = null; renderAccountState(); 
            }
            openRecentAccounts(); return;
        }
        if (event.target.closest("[data-open-settings]")) showModal(settingsModal);
        if (event.target.closest("[data-open-interview]")) openInterviewModal(selectedDate || dateKey(new Date()));
        if (event.target.closest(".modal-close,.modal-cancel")) {
            hideModal(appModal); resetApplicationEditor(); 
        }
        if (event.target.closest(".interview-modal-close")) hideModal(interviewModal);
        if (event.target.closest(".account-modal-close")) hideModal(accountModal);
        if (event.target.closest(".recent-accounts-close")) hideModal(recentAccountsModal);
        if (event.target.closest(".settings-modal-close")) hideModal(settingsModal);
        const authTab = event.target.closest("[data-auth-mode]");
        if (authTab) {
            setAuthMode(authTab.dataset.authMode);
        }
        if (event.target === appModal) {
            hideModal(appModal); resetApplicationEditor(); 
        } if (event.target === interviewModal) hideModal(interviewModal);
        if (event.target === accountModal) hideModal(accountModal); if (event.target === settingsModal) hideModal(settingsModal); if (event.target === recentAccountsModal) hideModal(recentAccountsModal);
        if (!event.target.closest("#accountMenu,[data-open-account],.profile-menu") && !accountMenu.hidden) accountMenu.hidden = true;
        const deleteButton = event.target.closest("[data-delete]");
        if (deleteButton) {
            const row = deleteButton.closest("tr");
            if (row) {
                const key = `${row.dataset.company}::${row.dataset.role}`; const deleted = JSON.parse(localStorage.getItem(deletedKey)||"[]"); if (!deleted.includes(key)) deleted.push(key); localStorage.setItem(deletedKey,JSON.stringify(deleted)); const id=row.dataset.id; localStorage.setItem(appKey,JSON.stringify(JSON.parse(localStorage.getItem(appKey)||"[]").filter(item => item.id !== id && `${item.company}::${item.role}` !== key))); row.remove(); 
            }
            const card = deleteButton.closest("[data-interview-id]");
            if (card) {
                saveInterviews(readInterviews().filter(item => item.id !== card.dataset.interviewId)); renderCalendar(); 
            }
            const rows = [...viewRoot.querySelectorAll(".full-table tbody tr")], count = viewRoot.querySelector("[data-visible-count]"); if (count) count.textContent = String(rows.filter(row=>!row.hidden).length);
        }
    });
    document.addEventListener("keydown", event => {
        if (event.key==="Escape") {
            hideModal(appModal); hideModal(interviewModal); hideModal(accountModal); hideModal(settingsModal); hideModal(recentAccountsModal); accountMenu.hidden = true;
        } 
    });
    document.querySelector("#applicationForm")?.addEventListener("submit", event => {
        event.preventDefault(); const form=event.currentTarget,data=new FormData(form),company=String(data.get("company")||"").trim(),role=String(data.get("role")||"").trim(); if(!company||!role)return;
        const appliedDate = String(data.get("date") || "").trim();
        if (editingApplication) {
            const old = editingApplication.row.dataset.created;
            const item = { id:editingApplication.id, company, role, status:String(data.get("status")||"Saved"), created:appliedDate ? new Date(`${appliedDate}T12:00:00`).toISOString() : old || new Date().toISOString() };
            if (editingApplication.sampleId) {
                const overrides = JSON.parse(localStorage.getItem(overridesKey) || "{}"); overrides[editingApplication.sampleId] = item; localStorage.setItem(overridesKey, JSON.stringify(overrides));
            }
            else {
                const applications = JSON.parse(localStorage.getItem(appKey) || "[]"), index = applications.findIndex(application => application.id === item.id);
                if (index !== -1) applications[index] = item;
                localStorage.setItem(appKey, JSON.stringify(applications));
            }
            updateApplicationRow(editingApplication.row, item);
            viewRoot.querySelector("[data-filter-input]")?.dispatchEvent(new Event("input"));
            form.reset(); hideModal(appModal); resetApplicationEditor(); return;
        }
        const created = appliedDate ? new Date(`${appliedDate}T12:00:00`).toISOString() : new Date().toISOString();
        const applications=JSON.parse(localStorage.getItem(appKey)||"[]"); applications.unshift({id:crypto.randomUUID(),company,role,status:String(data.get("status")||"Saved"),created}); localStorage.setItem(appKey,JSON.stringify(applications));
        form.reset(); hideModal(appModal); location.hash="#applications";
    });
    document.querySelector("#interviewForm")?.addEventListener("submit", event => {
        event.preventDefault(); const form=event.currentTarget,data=new FormData(form),date=String(data.get("date")||"").trim();
        if(!date || !form.reportValidity()) return;
        const item={id:crypto.randomUUID(),company:String(data.get("company")).trim(),role:String(data.get("role")).trim(),date,time:String(data.get("time")),type:String(data.get("type")).trim(),status:String(data.get("status"))};
        const events=readInterviews(); events.push(item); saveInterviews(events); form.reset(); hideModal(interviewModal); if(location.hash!=="#interviews")location.hash="#interviews"; else renderCalendar();
    });
    document.querySelector("#accountForm")?.addEventListener("submit", event => {
        event.preventDefault();
        const register = !document.querySelector("[data-name-field]").hidden;
        const form = event.currentTarget, data = new FormData(form), email = String(data.get("email")).trim();
        const known = recentAccounts.find(account => account.email.toLowerCase() === email.toLowerCase());
        const account = known || { id: email.toLowerCase(), email, name: register ? String(data.get("name")).trim() : (email.split("@")[0] || "JobPilot User").replace(/[._-]+/g, " ").replace(/\b\w/g, char => char.toUpperCase()) };
        currentAccount = account; rememberAccount(account); renderAccountState(); hideModal(accountModal); form.reset();
    });
    document.querySelector("#settingsForm")?.addEventListener("change", event => {
        if (event.target.name === "theme") {
            localStorage.setItem(themeKey, event.target.value); applyTheme(event.target.value); 
        }
        if (event.target.name === "scale") {
            localStorage.setItem(scaleKey, event.target.value); document.documentElement.style.setProperty("--ui-scale", event.target.value); 
        }
    });
    systemTheme.addEventListener("change", () => {
        if ((localStorage.getItem(themeKey) || "system") === "system") applyTheme("system"); 
    });
    document.querySelector("#scaleSelect").value = scalePreference;
    renderAccountState();
    window.addEventListener("resize", () => {
        accountMenu.hidden = true; 
    });
    window.addEventListener("hashchange", renderRoute); renderRoute();
})();
