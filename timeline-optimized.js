const TimelineApp = {
    events: [],
    characters: [],
    sortedCharacters: [],
    characterRegexMap: {},
    zoomLevel: 100,
    isLoggedIn: false,
    currentUser: null,
    favorites: {
        events: [],
        characters: [],
        years: []
    },
    isShowingFavorites: false,
    isShowingCharacterFromFavorites: false,
    passwordErrorCount: {},
    isPasswordVisible: false,
    
    // 性能优化：虚拟滚动配置
    virtualScroll: {
        visibleEvents: [],
        loadedYears: new Set(),
        eventHeight: 150,
        yearHeight: 50,
        bufferSize: 5,
        observer: null
    },
    
    // DOM元素缓存
    domCache: {},
    
    // 初始化应用
    async init() {
        console.log('开始初始化应用...');
        try {
            this.cacheDOMElements();
            this.showLoading();
            await this.loadEvents();
            await this.loadCharacters();
            this.setupVirtualScroll();
            this.setupEventListeners();
            this.loadFavorites();
            this.hideLoading();
            
            // 检查登录状态并初始化界面
            await this.checkLoginStateAndInit();
            
            console.log('应用初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            this.hideLoading();
            this.toast.error('初始化失败', '应用初始化失败，请刷新页面重试');
        }
    },

    // 检查登录状态并初始化界面
    async checkLoginStateAndInit() {
        const token = this.storage.getToken();
        if (token) {
            try {
                const user = await Promise.race([
                    this.storage.getUser(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('登录状态检查超时')), 5000))
                ]);
                this.isLoggedIn = true;
                this.currentUser = user;
                this.updateUserDisplay();
                this.loadFavoritesFromServer();
                this.renderTimeline();
                this.showTimelineContent();
            } catch (error) {
                console.error('检查登录状态错误:', error);
                this.storage.clearToken();
                this.isLoggedIn = false;
                this.currentUser = null;
                this.updateUserDisplay();
                this.hideTimelineContent();
            }
        } else {
            this.isLoggedIn = false;
            this.currentUser = null;
            this.updateUserDisplay();
            this.hideTimelineContent();
        }
    },
    
    // 缓存DOM元素
    cacheDOMElements() {
        this.domCache = {
            timeline: document.getElementById('timeline'),
            searchInput: document.getElementById('searchInput'),
            categoryFilter: document.getElementById('categoryFilter'),
            characterCategoryFilter: document.getElementById('characterCategoryFilter'),
            zoomLevel: document.getElementById('zoomLevel'),
            loginBtn: document.getElementById('loginBtn'),
            userMenu: document.getElementById('userMenu'),
            characterModal: document.getElementById('characterModal'),
            characterInfo: document.getElementById('characterInfo'),
            loginModal: document.getElementById('loginModal'),
            accountSettingsModal: document.getElementById('accountSettingsModal'),
            noResults: document.getElementById('noResults'),
            countdownText: document.getElementById('countdownText'),
            timelineContainer: document.querySelector('.timeline-container'),
            noLogin: document.getElementById('noLogin'),
            loginNowBtn: document.getElementById('loginNowBtn'),
            clearStorageBtn: document.getElementById('clearStorageBtn'),
            navBar: document.querySelector('.fixed-nav-bar')
        };

        console.log('DOM 元素缓存完成:', Object.keys(this.domCache));
        
        const missingElements = Object.entries(this.domCache)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
        
        if (missingElements.length > 0) {
            console.warn('缺少的 DOM 元素:', missingElements);
        }
    },
    
    // 设置虚拟滚动
    setupVirtualScroll() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const year = entry.target.dataset.year;
                    this.loadYearEvents(year);
                }
            });
        }, {
            rootMargin: '200px',
            threshold: 0.1
        });
        
        this.virtualScroll.observer = observer;
    },
    
    // 加载年份的事件
    loadYearEvents(year) {
        if (this.virtualScroll.loadedYears.has(year)) return;
        
        this.virtualScroll.loadedYears.add(year);
        const yearEvents = this.events.filter(e => e.year === year);
        
        if (yearEvents.length > 0) {
            this.renderYearEvents(year, yearEvents);
        }
    },
    
    // 渲染年份事件
    renderYearEvents(year, events) {
        const timeline = this.domCache.timeline;
        const yearPosition = this.yearPositions[year];
        
        if (!yearPosition) return;
        
        const zoomFactor = this.zoomLevel / 100;
        const yearToEventSpacing = 50;
        const eventSpacing = 150;
        const categoryOrder = ['political', 'military', 'technology', 'cultural'];
        
        // 使用 DocumentFragment 批量插入 DOM
        const fragment = document.createDocumentFragment();
        
        events.sort((a, b) => {
            const categoryIndexA = categoryOrder.indexOf(a.category);
            const categoryIndexB = categoryOrder.indexOf(b.category);
            
            if (categoryIndexA !== categoryIndexB) {
                return categoryIndexA - categoryIndexB;
            }
            
            return 0;
        }).forEach((event, eventIndex) => {
            const eventElement = this.createEventElement(
                event, 
                eventIndex, 
                yearPosition + yearToEventSpacing, 
                zoomFactor, 
                eventSpacing
            );
            
            // 添加到 fragment 而不是直接添加到 DOM
            fragment.appendChild(eventElement);
        });
        
        // 批量插入到 DOM
        timeline.appendChild(fragment);
    },
    
    // 加载历史事件数据
    async loadEvents() {
        console.log('开始加载事件数据...');
        if (typeof historicalEvents !== 'undefined') {
            this.events = historicalEvents;
            console.log('事件数据加载完成，共', this.events.length, '个事件');
        } else {
            console.error('historicalEvents 未定义');
            this.events = [];
        }
    },
    
    // 加载人物档案数据
    async loadCharacters() {
        console.log('开始加载人物数据...');
        if (typeof historicalCharacters !== 'undefined') {
            this.characters = historicalCharacters;
            this.sortedCharacters = [...this.characters].sort((a, b) => b.name.length - a.name.length);
            this.characterRegexMap = {};
            this.characters.forEach(character => {
                this.characterRegexMap[character.id] = new RegExp(`(${character.name})`, 'g');
            });
            console.log('人物数据加载完成，共', this.characters.length, '个人物');
        } else {
            console.error('historicalCharacters 未定义');
            this.characters = [];
            this.sortedCharacters = [];
            this.characterRegexMap = {};
        }
    },
    
    // 显示加载状态
    showLoading(message = '正在加载...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            const loadingText = loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loadingOverlay.classList.remove('fade-out');
            loadingOverlay.style.display = 'flex';
        }
    },

    // 隐藏加载状态
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }
    },

    // Toast通知系统
    toast: {
        container: null,
        
        // 初始化Toast容器
        init() {
            this.container = document.getElementById('toastContainer');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'toastContainer';
                this.container.className = 'toast-container';
                document.body.appendChild(this.container);
            }
        },
        
        // 显示Toast通知
        show(type, title, message, duration = 3000) {
            if (!this.container) {
                this.init();
            }
            
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <div class="toast-icon">${icons[type] || icons.info}</div>
                <div class="toast-content">
                    <div class="toast-title">${title}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close">&times;</button>
            `;
            
            this.container.appendChild(toast);
            
            // 关闭按钮事件
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.dismiss(toast));
            
            // 自动关闭
            if (duration > 0) {
                setTimeout(() => this.dismiss(toast), duration);
            }
            
            return toast;
        },
        
        // 关闭Toast通知
        dismiss(toast) {
            if (!toast || !toast.parentNode) return;
            
            toast.classList.add('slide-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        },
        
        // 显示成功消息
        success(title, message, duration) {
            return this.show('success', title, message, duration);
        },
        
        // 显示错误消息
        error(title, message, duration) {
            return this.show('error', title, message, duration);
        },
        
        // 显示警告消息
        warning(title, message, duration) {
            return this.show('warning', title, message, duration);
        },
        
        // 显示信息消息
        info(title, message, duration) {
            return this.show('info', title, message, duration);
        },
        
        // 清除所有Toast
        clearAll() {
            if (!this.container) return;
            
            const toasts = this.container.querySelectorAll('.toast');
            toasts.forEach(toast => this.dismiss(toast));
        }
    },
    
    // 存储管理模块：封装localStorage和API操作
    storage: {
        apiBaseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000/api' 
            : 'https://timeline-app-one.vercel.app/api',
        
        // 缓存机制
        cache: {
            data: new Map(),
            timestamps: new Map(),
            ttl: 60000 // 1分钟缓存
        },
        
        getCache(key) {
            const cached = this.cache.data.get(key);
            if (cached && Date.now() - this.cache.timestamps.get(key) < this.cache.ttl) {
                return cached;
            }
            return null;
        },
        
        setCache(key, value) {
            this.cache.data.set(key, value);
            this.cache.timestamps.set(key, Date.now());
        },
        
        clearCache() {
            this.cache.data.clear();
            this.cache.timestamps.clear();
        },
        
        getToken() {
            return localStorage.getItem('timeline_token');
        },
        
        setToken(token) {
            localStorage.setItem('timeline_token', token);
        },
        
        clearToken() {
            localStorage.removeItem('timeline_token');
        },
        
        async apiRequest(endpoint, options = {}) {
            const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
            const cachedData = this.getCache(cacheKey);
            
            if (cachedData && options.method === 'GET') {
                return cachedData;
            }
            
            const token = this.getToken();
            const headers = {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            };
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                    ...options,
                    headers: { ...headers, ...options.headers },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `请求失败: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (options.method === 'GET') {
                    this.setCache(cacheKey, data);
                }
                
                return data;
            } catch (error) {
                clearTimeout(timeoutId);
                
                if (error.name === 'AbortError') {
                    throw new Error('请求超时，请检查网络连接');
                }
                
                throw error;
            }
        },

        async login(username, password) {
            const response = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '请求失败');
            }
            
            if (data.token) {
                this.setToken(data.token);
            }
            
            return data;
        },
        
        async getUser() {
            return this.apiRequest('/user', {
                method: 'GET'
            });
        },
        
        async updateUser(userData) {
            return this.apiRequest('/user', {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        },

        async getFavorites() {
            return this.apiRequest('/favorites', {
                method: 'GET'
            });
        },
        
        async addFavorite(type, id) {
            return this.apiRequest('/favorites', {
                method: 'POST',
                body: JSON.stringify({ type, id })
            });
        },
        
        async removeFavorite(type, id) {
            return this.apiRequest('/favorites', {
                method: 'DELETE',
                body: JSON.stringify({ type, id })
            });
        },
        
        save(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('保存数据失败:', e);
                return false;
            }
        },
        
        load(key) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : null;
            } catch (e) {
                console.error('读取数据失败:', e);
                return null;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('删除数据失败:', e);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('清空数据失败:', e);
                return false;
            }
        }
    },
    
    // 渲染时间轴（优化版）
    renderTimeline() {
        try {
            console.log('开始渲染时间轴...');
            const timeline = this.domCache.timeline;
            const timelineLine = timeline.querySelector('.timeline-line');
            
            if (!timeline) {
                console.error('timeline 元素不存在');
                return;
            }
            
            // 清空现有内容
            timeline.querySelectorAll('.timeline-event').forEach(el => el.remove());
            timeline.querySelectorAll('.timeline-year-marker').forEach(el => el.remove());
            
            this.updatePageText();
            
            const filteredEvents = this.filterEvents();
            const sortedEvents = filteredEvents.sort((a, b) => this.parseYear(a.year) - this.parseYear(b.year));
            
            const eventsByYear = {};
            sortedEvents.forEach(event => {
                if (!eventsByYear[event.year]) {
                    eventsByYear[event.year] = [];
                }
                eventsByYear[event.year].push(event);
            });
            
            const categoryOrder = ['political', 'military', 'technology', 'cultural'];
            
            const noResultsElement = this.domCache.noResults;
            const timelineContainer = this.domCache.timelineContainer;
            
            if (sortedEvents.length === 0) {
                noResultsElement.style.display = 'block';
                timelineContainer.style.display = 'none';
                
                let countdown = 5;
                const countdownElement = this.domCache.countdownText;
                
                const timer = setInterval(() => {
                    countdown--;
                    countdownElement.textContent = `${countdown}秒后自动返回`;
                    
                    if (countdown <= 0) {
                        clearInterval(timer);
                        this.clearSearch();
                    }
                }, 1000);
            } else {
                noResultsElement.style.display = 'none';
                timelineContainer.style.display = 'block';
            }
        
        // 只渲染可见的年份（虚拟滚动）
        const sortedYears = Object.keys(eventsByYear).sort((a, b) => this.parseYear(a) - this.parseYear(b));
        
        const eventSpacing = 150;
        const yearToEventSpacing = 50;
        const yearSpacing = 150;
        const zoomFactor = this.zoomLevel / 100;
        
        let currentTop = 80;
        const yearPositions = {};
        
        // 使用 DocumentFragment 批量插入
        const fragment = document.createDocumentFragment();
        
        sortedYears.forEach((year, yearIndex) => {
            const yearEvents = eventsByYear[year];
            
            yearEvents.sort((a, b) => {
                const categoryIndexA = categoryOrder.indexOf(a.category);
                const categoryIndexB = categoryOrder.indexOf(b.category);
                
                if (categoryIndexA !== categoryIndexB) {
                    return categoryIndexA - categoryIndexB;
                }
                
                return 0;
            });
            
            const yearMarker = this.createYearMarker({ year }, currentTop, zoomFactor);
            fragment.appendChild(yearMarker);
            
            yearPositions[year] = currentTop;
            
            // 只渲染前 10 个事件，其他使用懒加载
            const eventsToRender = yearEvents.slice(0, 10);
            eventsToRender.forEach((event, eventIndex) => {
                const eventElement = this.createEventElement(event, eventIndex, currentTop + yearToEventSpacing, zoomFactor, eventSpacing);
                fragment.appendChild(eventElement);
            });
            
            // 如果有更多事件，添加"加载更多"按钮
            if (yearEvents.length > 10) {
                const loadMoreBtn = document.createElement('button');
                loadMoreBtn.className = 'load-more-btn';
                loadMoreBtn.textContent = `加载更多 (${yearEvents.length - 10} 个事件)`;
                loadMoreBtn.dataset.year = year;
                loadMoreBtn.onclick = () => this.loadMoreEvents(year, 10);
                fragment.appendChild(loadMoreBtn);
            }
            
            currentTop += yearToEventSpacing + yearEvents.length * eventSpacing + yearSpacing;
        });
        
        // 批量插入到 DOM
        timeline.appendChild(fragment);
        
        this.yearPositions = yearPositions;
        this.updateTimelineHeight();
        console.log('时间轴渲染完成');
        } catch (error) {
            console.error('渲染时间轴失败:', error);
            this.toast.error('渲染失败', '渲染时间轴失败，请刷新页面重试');
        }
    },
    
    // 加载更多事件
    loadMoreEvents(year, startIndex) {
        const yearEvents = this.events.filter(e => e.year === year);
        const eventsToLoad = yearEvents.slice(startIndex, startIndex + 10);
        
        if (eventsToLoad.length === 0) {
            // 移除"加载更多"按钮
            const loadMoreBtn = document.querySelector(`.load-more-btn[data-year="${year}"]`);
            if (loadMoreBtn) {
                loadMoreBtn.remove();
            }
            return;
        }
        
        const timeline = this.domCache.timeline;
        const yearPosition = this.yearPositions[year];
        const zoomFactor = this.zoomLevel / 100;
        const yearToEventSpacing = 50;
        const eventSpacing = 150;
        
        const fragment = document.createDocumentFragment();
        
        eventsToLoad.forEach((event, index) => {
            const eventElement = this.createEventElement(
                event,
                startIndex + index,
                yearPosition + yearToEventSpacing,
                zoomFactor,
                eventSpacing
            );
            fragment.appendChild(eventElement);
        });
        
        timeline.appendChild(fragment);
        
        // 更新"加载更多"按钮
        const loadMoreBtn = document.querySelector(`.load-more-btn[data-year="${year}"]`);
        if (loadMoreBtn) {
            const remainingEvents = yearEvents.length - (startIndex + eventsToLoad.length);
            if (remainingEvents <= 0) {
                loadMoreBtn.remove();
            } else {
                loadMoreBtn.textContent = `加载更多 (${remainingEvents} 个事件)`;
            }
        }
        
        this.updateTimelineHeight();
    },
    
    updatePageText() {
        const filteredEvents = this.filterEvents();
        const totalEvents = filteredEvents.length;
        const totalYears = new Set(filteredEvents.map(e => e.year)).size;
        
        const pageText = document.querySelector('.page-text');
        if (pageText) {
            pageText.textContent = `共 ${totalEvents} 个事件，${totalYears} 个年份`;
        }
    },
    
    clearSearch() {
        this.domCache.searchInput.value = '';
        this.domCache.categoryFilter.value = 'all';
        this.domCache.characterCategoryFilter.value = 'all';
        this.renderTimeline();
    },
    
    highlightSearchText(text, searchTerm) {
        if (!searchTerm || !text) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    },
    
    linkCharactersInText(text, searchTerm) {
        if (!text || !this.characters || this.characters.length === 0) return text;
        
        let result = text;
        const placeholders = [];
        let placeholderIndex = 0;
        
        this.sortedCharacters.forEach(character => {
            const regex = this.characterRegexMap[character.id];
            result = result.replace(regex, `<span class="character-link" data-char-id="${character.id}">$1</span>`);
        });
        
        if (searchTerm) {
            result = result.replace(/<span class="character-link" data-char-id="([^"]+)">([^<]*)<\/span>/g, (match, charId, charName) => {
                const placeholder = `__PLACEHOLDER_${placeholderIndex}__`;
                placeholders.push({ placeholder, charId, charName });
                placeholderIndex++;
                return placeholder;
            });
            
            result = result.replace(new RegExp(`(${searchTerm})`, 'gi'), '<span class="search-highlight">$1</span>');
            
            placeholders.forEach(({ placeholder, charId, charName }) => {
                const highlightedName = charName.replace(new RegExp(`(${searchTerm})`, 'gi'), '<span class="search-highlight">$1</span>');
                result = result.replace(placeholder, `<span class="character-link" data-char-id="${charId}">${highlightedName}</span>`);
            });
        }
        
        return result;
    },
    
    createEventElement(event, index, currentTop, zoomFactor, eventSpacing) {
        const eventDiv = document.createElement('div');
        eventDiv.className = `timeline-event ${index % 2 === 0 ? 'left' : 'right'}`;
        eventDiv.dataset.index = index;
        eventDiv.dataset.yearOffset = currentTop;
        
        const topPosition = (currentTop + index * eventSpacing) * zoomFactor;
        
        eventDiv.style.top = `${topPosition}px`;
        eventDiv.style.transform = `scale(${zoomFactor})`;
        
        const searchTerm = this.domCache.searchInput.value.trim();
        const categoryLabel = this.getCategoryLabel(event.category);
        const isFavorited = this.favorites.events.some(f => f.id === event.id);
        
        const linkedTitle = this.linkCharactersInText(event.title, searchTerm);
        const linkedDescription = this.linkCharactersInText(event.description, searchTerm);
        const linkedCategory = this.linkCharactersInText(categoryLabel, searchTerm);
        
        eventDiv.innerHTML = `
            <div class="event-card ${event.category}">
                <div class="event-category">${linkedCategory}</div>
                <div class="event-title">${linkedTitle}</div>
                <div class="event-description">${linkedDescription}</div>
                ${event.tags ? `
                    <div class="event-tags">
                        ${event.tags.map(tag => `<span class="event-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="event-actions">
                    <button class="action-btn favorite-btn ${isFavorited ? 'active' : ''}" data-event-id="${event.id}">
                        ${isFavorited ? '已收藏' : '收藏'}
                    </button>
                </div>
            </div>
            <div class="event-marker"></div>
        `;
        
        return eventDiv;
    },
    
    createYearMarker(event, currentTop, zoomFactor) {
        const yearMarker = document.createElement('div');
        yearMarker.className = 'timeline-year-marker';
        yearMarker.textContent = event.year;
        yearMarker.dataset.year = event.year;
        yearMarker.dataset.yearOffset = currentTop;
        
        const topPosition = currentTop * zoomFactor;
        
        yearMarker.style.top = `${topPosition}px`;
        yearMarker.style.transform = 'translateX(-50%)';
        
        return yearMarker;
    },
    
    updateTimelineHeight() {
        const timeline = this.domCache.timeline;
        const yearMarkers = timeline.querySelectorAll('.timeline-year-marker');
        const events = timeline.querySelectorAll('.timeline-event');
        
        let maxTopPosition = 0;
        
        yearMarkers.forEach(marker => {
            const topPosition = parseFloat(marker.style.top) || 0;
            maxTopPosition = Math.max(maxTopPosition, topPosition);
        });
        
        events.forEach(event => {
            const topPosition = parseFloat(event.style.top) || 0;
            maxTopPosition = Math.max(maxTopPosition, topPosition);
        });
        
        const height = Math.max(maxTopPosition + 200, window.innerHeight);
        timeline.style.height = `${height}px`;
    },
    
    parseYear(yearStr) {
        if (yearStr.includes('公元前')) {
            return -parseInt(yearStr.replace('公元前', '').replace('年', ''));
        }
        return parseInt(yearStr.replace('年', ''));
    },
    
    getCategoryLabel(category) {
        const labels = {
            'political': '政治',
            'cultural': '文化',
            'technology': '科技',
            'military': '军事'
        };
        return labels[category] || category;
    },
    
    filterEvents() {
        const categoryFilter = this.domCache.categoryFilter.value;
        const characterCategoryFilter = this.domCache.characterCategoryFilter.value;
        const searchInput = this.domCache.searchInput.value.toLowerCase();
        
        return this.events.filter(event => {
            const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
            
            let matchesCharacterCategory = true;
            if (characterCategoryFilter !== 'all' && event.characters) {
                matchesCharacterCategory = event.characters.some(char => {
                    const character = this.characters.find(c => c.id === char.id);
                    return character && character.category === characterCategoryFilter;
                });
            }
            
            const matchesSearch = !searchInput || 
                event.title.toLowerCase().includes(searchInput) ||
                event.description.toLowerCase().includes(searchInput) ||
                (event.characters && event.characters.some(char => 
                    char.name.toLowerCase().includes(searchInput)
                ));
            return matchesCategory && matchesCharacterCategory && matchesSearch;
        });
    },
    
    getCategoryName(category) {
        const categoryNames = {
            'political': '政治家',
            'military': '军事家',
            'scientist': '科学家',
            'literary': '文学家',
            'philosopher': '哲学家'
        };
        return categoryNames[category] || category;
    },
    
    setupEventListeners() {
        document.getElementById('categoryFilter').addEventListener('change', () => this.renderTimeline());
        document.getElementById('characterCategoryFilter').addEventListener('change', () => this.renderTimeline());
        
        document.getElementById('searchBtn').addEventListener('click', () => this.renderTimeline());
        document.getElementById('searchInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.renderTimeline();
            }
        });
        
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        
        document.getElementById('loginBtn').addEventListener('click', (e) => {
            if (this.isLoggedIn) {
                e.stopPropagation();
                this.toggleUserMenu();
            } else {
                this.showLoginModal();
            }
        });
        
        document.getElementById('accountSettings').addEventListener('click', () => this.showAccountSettings());
        document.getElementById('switchAccount').addEventListener('click', () => this.switchAccount());
        document.getElementById('viewFavorites').addEventListener('click', () => this.showFavoritesList());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#loginBtn') && !e.target.closest('#userMenu')) {
                this.hideUserMenu();
            }
        });
        
        document.getElementById('modalClose').addEventListener('click', () => this.hideCharacterModal());
        document.getElementById('modalOverlay').addEventListener('click', () => this.hideCharacterModal());
        
        document.getElementById('loginClose').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('loginOverlay').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        
        const passwordToggleBtn = document.getElementById('passwordToggleBtn');
        if (passwordToggleBtn) {
            passwordToggleBtn.addEventListener('click', () => this.togglePasswordVisibility());
        }
        
        if (this.domCache.loginNowBtn) {
            this.domCache.loginNowBtn.addEventListener('click', () => this.showLoginModal());
        }
        
        if (this.domCache.clearStorageBtn) {
            this.domCache.clearStorageBtn.addEventListener('click', () => {
                localStorage.clear();
                this.toast.success('缓存已清除', '请刷新页面');
                setTimeout(() => location.reload(), 1000);
            });
        }

        document.getElementById('accountSettingsClose').addEventListener('click', () => this.hideAccountSettings());
        document.getElementById('accountSettingsOverlay').addEventListener('click', () => this.hideAccountSettings());
        document.getElementById('accountSettingsForm').addEventListener('submit', (e) => this.handleAccountSettings(e));
        
        document.addEventListener('click', (e) => {
            const eventCard = e.target.closest('.event-card');
            if (eventCard) {
                document.querySelectorAll('.event-actions').forEach(actions => {
                    actions.classList.remove('visible');
                });
                const eventActions = eventCard.querySelector('.event-actions');
                if (eventActions) {
                    eventActions.classList.add('visible');
                }
            }
            
            const characterLink = e.target.closest('.character-link');
            if (characterLink) {
                e.preventDefault();
                e.stopPropagation();
                const charId = characterLink.dataset.charId;
                this.showCharacterModal(charId);
            }
            
            if (e.target.classList.contains('favorite-btn')) {
                this.toggleFavorite(e.target);
            }
            
            if (!e.target.closest('.event-card') && !e.target.closest('.modal-content')) {
                document.querySelectorAll('.event-actions').forEach(actions => {
                    actions.classList.remove('visible');
                });
            }
        });
        
        window.addEventListener('resize', () => this.updateTimelineHeight());
    },
    
    handleWheelZoom(e) {
    },
    
    zoomIn() {
        if (this.zoomLevel < 150) {
            this.zoomLevel += 10;
            this.updateZoom();
        }
    },
    
    zoomOut() {
        if (this.zoomLevel > 80) {
            this.zoomLevel -= 10;
            this.updateZoom();
        }
    },
    
    updateZoom() {
        const zoomLevelElement = this.domCache.zoomLevel;
        if (zoomLevelElement) {
            zoomLevelElement.textContent = `${this.zoomLevel}%`;
        }
        
        const timeline = this.domCache.timeline;
        if (!timeline) return;
        
        const events = timeline.querySelectorAll('.timeline-event');
        const yearMarkers = timeline.querySelectorAll('.timeline-year-marker');
        
        const yearToEventSpacing = 50;
        const eventSpacing = 150;
        const zoomFactor = this.zoomLevel / 100;
        
        events.forEach(event => {
            const currentTop = parseInt(event.dataset.yearOffset);
            const index = parseInt(event.dataset.index);
            const topPosition = (currentTop + yearToEventSpacing + index * eventSpacing) * zoomFactor;
            
            event.style.top = `${topPosition}px`;
            event.style.transform = `scale(${zoomFactor})`;
        });
        
        yearMarkers.forEach(marker => {
            const currentTop = parseInt(marker.dataset.yearOffset);
            const topPosition = currentTop * zoomFactor;
            
            marker.style.top = `${topPosition}px`;
            marker.style.transform = 'translateX(-50%)';
        });
        
        this.updateTimelineHeight();
    },
    
    showLoginModal() {
        this.isShowingFavorites = false;
        this.isShowingCharacterFromFavorites = false;
        if (!this.isLoggedIn) {
            this.domCache.loginModal.classList.add('active');
        }
    },
    
    hideLoginModal() {
        this.domCache.loginModal.classList.remove('active');
    },

    showTimelineContent() {
        const timelineContainer = this.domCache.timelineContainer;
        const noLogin = this.domCache.noLogin;
        const navBar = this.domCache.navBar;
        if (timelineContainer) {
            timelineContainer.style.display = 'block';
        }
        if (noLogin) {
            noLogin.style.display = 'none';
        }
        if (navBar) {
            navBar.classList.remove('hidden');
        }
    },
    
    hideTimelineContent() {
        const timelineContainer = this.domCache.timelineContainer;
        const noLogin = this.domCache.noLogin;
        const navBar = this.domCache.navBar;
        if (timelineContainer) {
            timelineContainer.style.display = 'none';
        }
        if (noLogin) {
            noLogin.style.display = 'block';
        }
        if (navBar) {
            navBar.classList.add('hidden');
        }
    },

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const passwordToggleBtn = document.getElementById('passwordToggleBtn');
        
        if (passwordInput && passwordToggleBtn) {
            this.isPasswordVisible = !this.isPasswordVisible;
            passwordInput.type = this.isPasswordVisible ? 'text' : 'password';
            
            const eyeOpen = passwordToggleBtn.querySelector('.eye-open');
            const eyeClosed = passwordToggleBtn.querySelector('.eye-closed');
            
            if (eyeOpen && eyeClosed) {
                if (this.isPasswordVisible) {
                    eyeOpen.style.display = 'none';
                    eyeClosed.style.display = 'block';
                } else {
                    eyeOpen.style.display = 'block';
                    eyeClosed.style.display = 'none';
                }
            }
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.toast.warning('输入错误', '请输入用户名和密码');
            return;
        }
        
        try {
            this.showLoading('正在登录...');
            const data = await this.storage.login(username, password);
            
            console.log('登录成功，用户数据:', data.user);
            
            if (data.user) {
                this.isLoggedIn = true;
                this.currentUser = data.user;
                console.log('当前用户:', this.currentUser);
                console.log('用户头像:', this.currentUser.avatar);
                this.updateUserDisplay();
                this.hideLoginModal();
                this.loadFavoritesFromServer();
                this.renderTimeline();
                this.showTimelineContent();
                
                if (this.passwordErrorCount[username]) {
                    delete this.passwordErrorCount[username];
                }
            }
        } catch (error) {
            if (error.message === '用户未注册，请注册新账户再登录') {
                this.toast.error('登录失败', '用户名或密码错误');
            } else if (error.message === '密码错误') {
                if (!this.passwordErrorCount[username]) {
                    this.passwordErrorCount[username] = 0;
                }
                this.passwordErrorCount[username]++;
                
                const remainingAttempts = 5 - this.passwordErrorCount[username];
                
                if (this.passwordErrorCount[username] >= 5) {
                    this.toast.error('密码错误次数过多', `您已连续输错5次密码，建议更改密码`);
                } else {
                    this.toast.error('密码错误', `密码错误，还剩${remainingAttempts}次尝试机会`);
                }
            } else {
                this.toast.error('登录失败', error.message || '登录失败，请重试');
            }
        } finally {
            this.hideLoading();
        }
    },
    
    logout() {
        console.log('logout 被调用');
        this.isLoggedIn = false;
        this.currentUser = null;
        this.storage.clearToken();
        this.isShowingFavorites = false;
        this.isShowingCharacterFromFavorites = false;
        console.log('已清除token，准备更新显示');
        this.updateUserDisplay();
        this.hideUserMenu();
        this.hideTimelineContent();
        this.showLoginModal();
        console.log('logout 完成');
    },

    selectSettingsAvatar(avatarType) {
        document.getElementById('settingsAvatar').value = avatarType;
        
        document.querySelectorAll('#accountSettingsModal .avatar-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`#accountSettingsModal .avatar-option[data-avatar="${avatarType}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    },
    
    handleCustomAvatar(input) {
        const file = input.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            this.toast.warning('文件错误', '请选择图片文件');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            this.toast.warning('文件过大', '图片大小不能超过 2MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result;
            
            document.getElementById('settingsAvatar').value = base64Data;
            
            document.querySelectorAll('#accountSettingsModal .avatar-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            const customOption = document.querySelector(`#accountSettingsModal .avatar-option[data-avatar="custom"]`);
            if (customOption) {
                customOption.classList.add('selected');
                
                const preview = customOption.querySelector('.avatar-preview');
                if (preview) {
                    preview.innerHTML = `<img src="${base64Data}" alt="自定义头像" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                }
            }
        };
        reader.readAsDataURL(file);
    },
    
    switchAccount() {
        this.hideUserMenu();
        this.logout();
        this.showLoginModal();
    },
    
    saveLoginState(username) {
        this.storage.save('timeline_user', { username, loginTime: new Date().toISOString() });
    },
    
    async checkLoginState() {
        const token = this.storage.getToken();
        if (token) {
            try {
                const user = await Promise.race([
                    this.storage.getUser(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('登录状态检查超时')), 5000))
                ]);
                this.isLoggedIn = true;
                this.currentUser = user;
                this.updateUserDisplay();
                this.loadFavoritesFromServer();
            } catch (error) {
                console.error('检查登录状态错误:', error);
                this.storage.clearToken();
                this.isLoggedIn = false;
                this.currentUser = null;
                this.updateUserDisplay();
            }
        }
    },
    
    updateUserDisplay() {
        const loginBtn = this.domCache.loginBtn;
        
        console.log('updateUserDisplay 被调用');
        console.log('isLoggedIn:', this.isLoggedIn);
        console.log('currentUser:', this.currentUser);
        
        if (this.isLoggedIn && this.currentUser) {
            const avatar = this.generateAvatar(this.currentUser.avatar);
            console.log('生成的头像HTML:', avatar);
            loginBtn.innerHTML = `<div class="user-avatar">${avatar}</div>`;
            loginBtn.classList.add('logged-in');
            console.log('已设置登录状态');
        } else {
            loginBtn.textContent = '登录';
            loginBtn.classList.remove('logged-in');
            console.log('已设置未登录状态');
        }
    },
    
    generateAvatar(avatarType) {
        if (!avatarType) avatarType = 'blue';
        
        if (avatarType.startsWith('data:image/')) {
            return `<img src="${avatarType}" alt="自定义头像" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
        
        const avatars = {
            blue: '<div class="avatar-initial blue-smile">😊</div>',
            yellow: '<div class="avatar-initial yellow-smile">😊</div>',
            green: '<div class="avatar-initial green-smile">😊</div>',
            pink: '<div class="avatar-initial pink-smile">😊</div>'
        };
        
        return avatars[avatarType] || avatars.blue;
    },
    
    showUserMenu() {
        if (!this.userMenuElement) {
            this.userMenuElement = this.domCache.userMenu;
        }
        if (this.userMenuElement) {
            this.userMenuElement.classList.add('active');
        }
    },
    
    hideUserMenu() {
        if (!this.userMenuElement) {
            this.userMenuElement = this.domCache.userMenu;
        }
        if (this.userMenuElement) {
            this.userMenuElement.classList.remove('active');
        }
    },
    
    toggleUserMenu() {
        if (!this.userMenuElement) {
            this.userMenuElement = this.domCache.userMenu;
        }
        if (this.userMenuElement) {
            this.userMenuElement.classList.toggle('active');
        }
    },
    
    showAccountSettings() {
        this.hideUserMenu();
        this.isShowingFavorites = false;
        this.isShowingCharacterFromFavorites = false;
        
        const modal = this.domCache.accountSettingsModal;
        const usernameInput = document.getElementById('settingsUsername');
        const emailInput = document.getElementById('settingsEmail');
        const avatarInput = document.getElementById('settingsAvatar');
        
        if (this.currentUser) {
            usernameInput.value = this.currentUser.username;
            emailInput.value = this.currentUser.email || '';
            avatarInput.value = this.currentUser.avatar || 'blue';
            
            document.querySelectorAll('#accountSettingsModal .avatar-option').forEach(option => {
                option.classList.remove('selected');
                const avatarType = option.dataset.avatar;
                
                if (this.currentUser.avatar && this.currentUser.avatar.startsWith('data:image/')) {
                    if (avatarType === 'custom') {
                        option.classList.add('selected');
                        const preview = option.querySelector('.avatar-preview');
                        if (preview) {
                            preview.innerHTML = `<img src="${this.currentUser.avatar}" alt="自定义头像" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                        }
                    }
                } else if (avatarType === this.currentUser.avatar) {
                    option.classList.add('selected');
                }
            });
        }
        
        modal.classList.add('active');
    },
    
    hideAccountSettings() {
        this.domCache.accountSettingsModal.classList.remove('active');
    },
    
    async handleAccountSettings(e) {
        e.preventDefault();
        
        const email = document.getElementById('settingsEmail').value;
        const newPassword = document.getElementById('settingsNewPassword').value;
        const confirmPassword = document.getElementById('settingsConfirmPassword').value;
        
        if (newPassword && newPassword !== confirmPassword) {
            this.toast.warning('密码错误', '两次输入的密码不一致');
            return;
        }
        
        try {
            const updateData = {};
            
            if (email) {
                updateData.email = email;
            }
            if (newPassword) {
                updateData.password = newPassword;
            }
            
            const avatar = document.getElementById('settingsAvatar').value;
            if (avatar) {
                updateData.avatar = avatar;
            }
            
            if (Object.keys(updateData).length > 0) {
                await this.storage.updateUser(updateData);
                
                if (updateData.email) {
                    this.currentUser.email = updateData.email;
                }
                if (updateData.avatar) {
                    this.currentUser.avatar = updateData.avatar;
                    this.updateUserDisplay();
                }
                
                this.toast.success('保存成功', '账号设置保存成功！');
            } else {
                this.toast.warning('输入错误', '请输入要修改的信息');
            }
            
            this.hideAccountSettings();
        } catch (error) {
            this.toast.error('保存失败', '保存失败：' + (error.message || '未知错误'));
        }
    },
    
    showFavoritesList() {
        this.hideUserMenu();
        
        this.isShowingFavorites = true;
        
        const favorites = this.favorites;
        let content = '<h3>我的收藏</h3>';
        
        if (favorites.events.length === 0 && favorites.characters.length === 0) {
            content += '<p>暂无收藏内容</p>';
        } else {
            if (favorites.events.length > 0) {
                content += '<h4>收藏的事件</h4>';
                content += '<ul class="favorites-list">';
                
                let sortedEvents = [...favorites.events];
                sortedEvents.sort((a, b) => a.timestamp - b.timestamp);
                
                sortedEvents.forEach((fav, index) => {
                    const event = this.events.find(e => e.id === fav.id);
                    if (event) {
                        content += `
                            <li class="favorite-item ${event.category}" data-type="event" data-id="${fav.id}" data-index="${index}" draggable="true">
                                <span class="favorite-content" onclick="TimelineApp.toggleFavoriteActions(this)">${event.year}年 - ${event.title}</span>
                                <div class="favorite-actions">
                                    <button class="action-icon-btn" onclick="TimelineApp.unfavoriteItem('event', '${fav.id}')">✕</button>
                                </div>
                            </li>
                        `;
                    }
                });
                content += '</ul>';
            }
            
            if (favorites.characters.length > 0) {
                content += '<h4>收藏的人物</h4>';
                content += '<ul class="favorites-list">';
                
                let sortedCharacters = [...favorites.characters];
                sortedCharacters.sort((a, b) => a.timestamp - b.timestamp);
                
                sortedCharacters.forEach((fav, index) => {
                    const character = this.characters.find(c => c.id === fav.id);
                    if (character) {
                        content += `
                            <li class="favorite-item" data-type="character" data-id="${fav.id}" data-index="${index}" draggable="true">
                                <span class="favorite-content" onclick="TimelineApp.toggleFavoriteActions(this)">
                                    <span class="character-name">
                                        <span class="character-link" onclick="event.stopPropagation(); TimelineApp.showCharacterFromFavorites('${fav.id}')">${character.name}</span>
                                        <span class="character-dates">${character.birth} - ${character.death}</span>
                                    </span>
                                </span>
                                <div class="favorite-actions">
                                    <button class="action-icon-btn" onclick="TimelineApp.unfavoriteItem('character', '${fav.id}')">✕</button>
                                </div>
                            </li>
                        `;
                    }
                });
                content += '</ul>';
            }
        }
        
        const modal = this.domCache.characterModal;
        const modalInfo = this.domCache.characterInfo;
        modalInfo.innerHTML = content;
        modal.classList.add('active');
        
        this.initDragAndDrop();
    },
    
    toggleFavoriteActions(element) {
        const actionsDiv = element.nextElementSibling;
        if (actionsDiv && actionsDiv.classList.contains('favorite-actions')) {
            actionsDiv.style.display = actionsDiv.style.display === 'none' ? 'flex' : 'none';
        }
    },
    
    showCharacterFromFavorites(charId) {
        this.isShowingCharacterFromFavorites = true;
        this.showCharacterModal(charId);
    },
    
    initDragAndDrop() {
        const items = document.querySelectorAll('.favorite-item');
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: item.dataset.type,
                    id: item.dataset.id,
                    index: parseInt(item.dataset.index)
                }));
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingItem = document.querySelector('.dragging');
                if (draggingItem !== item) {
                    const list = item.closest('.favorites-list');
                    const allItems = [...list.querySelectorAll('.favorite-item')];
                    const draggingIndex = allItems.indexOf(draggingItem);
                    const targetIndex = allItems.indexOf(item);
                    
                    if (draggingIndex < targetIndex) {
                        list.insertBefore(draggingItem, item.nextSibling);
                    } else {
                        list.insertBefore(draggingItem, item);
                    }
                }
            });
        });
        
        const modal = document.getElementById('characterModal');
        modal.addEventListener('dragend', () => {
            this.saveFavoritesOrder();
        });
    },
    
    async saveFavoritesOrder() {
        try {
            const eventItems = document.querySelectorAll('.favorites-list:first-of-type .favorite-item');
            const characterItems = document.querySelectorAll('.favorites-list:last-of-type .favorite-item');
            
            this.favorites.events = [...eventItems].map((item, index) => {
                const existing = this.favorites.events.find(f => f.id === item.dataset.id);
                return existing ? { ...existing, customOrder: index } : null;
            }).filter(Boolean);
            
            this.favorites.characters = [...characterItems].map((item, index) => {
                const existing = this.favorites.characters.find(f => f.id === item.dataset.id);
                return existing ? { ...existing, customOrder: index } : null;
            }).filter(Boolean);
            
            console.log('收藏排序已更新');
        } catch (error) {
            console.error('保存收藏排序失败:', error);
            this.toast.error('保存失败', '保存收藏排序失败');
        }
    },
    
    async unfavoriteItem(type, id) {
        if (!confirm('确定要取消收藏吗？')) {
            return;
        }
        
        try {
            await this.storage.removeFavorite(type, id);
            
            if (type === 'event') {
                this.favorites.events = this.favorites.events.filter(f => f.id !== id);
            } else if (type === 'character') {
                this.favorites.characters = this.favorites.characters.filter(f => f.id !== id);
            }
            
            this.showFavoritesList();
            this.renderTimeline();
        } catch (error) {
            console.error('取消收藏失败:', error);
            this.toast.error('操作失败', '保存失败：' + (error.message || '未知错误'));
        }
    },
    
    showCharacterModal(charId) {
        const character = this.characters.find(c => c.id === charId);
        if (!character) return;
        
        const characterInfo = this.domCache.characterInfo;
        const isFavorited = this.favorites.characters.some(f => f.id === character.id);
        
        characterInfo.innerHTML = `
            <h2>${character.name}</h2>
            <div class="character-title">${character.title}</div>
            <div class="character-dates">${character.birth} - ${character.death}</div>
            ${character.category ? `<div class="character-category">${this.getCategoryName(character.category)}</div>` : ''}
            <div class="character-bio">${character.description}</div>
            
            ${character.achievements ? `
                <div class="character-section">
                    <h3>主要成就</h3>
                    <ul class="character-list">
                        ${character.achievements.map(ach => `<li>${ach}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${character.relatedEvents ? `
                <div class="character-section">
                    <h3>相关事件</h3>
                    <ul class="character-list">
                        ${character.relatedEvents.map(eventId => {
                            const event = this.events.find(e => e.id === eventId);
                            return event ? `<li>${event.year} - ${event.title}</li>` : '';
                        }).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div class="event-actions">
                <button class="action-btn favorite-btn ${isFavorited ? 'active' : ''}" data-char-id="${character.id}">
                    ${isFavorited ? '已收藏' : '收藏'}
                </button>
            </div>
        `;
        
        this.domCache.characterModal.classList.add('active');
    },
    
    hideCharacterModal() {
        const modalInfo = this.domCache.characterInfo;
        const isFavoritesList = modalInfo.querySelector('h3')?.textContent === '我的收藏';
        
        if (isFavoritesList && this.isShowingFavorites) {
            this.domCache.characterModal.classList.remove('active');
            this.isShowingFavorites = false;
        } else if (this.isShowingCharacterFromFavorites) {
            this.isShowingCharacterFromFavorites = false;
            this.showFavoritesList();
        } else {
            this.domCache.characterModal.classList.remove('active');
        }
    },
    
    async toggleFavorite(btn) {
        const eventId = btn.dataset.eventId;
        const charId = btn.dataset.charId;
        
        if (eventId) {
            const index = this.favorites.events.findIndex(f => f.id === eventId);
            if (index > -1) {
                await this.storage.removeFavorite('event', eventId);
                this.favorites.events.splice(index, 1);
                btn.textContent = '收藏';
                btn.classList.remove('active');
            } else {
                await this.storage.addFavorite('event', eventId);
                this.favorites.events.push({ id: eventId, timestamp: Date.now() });
                btn.textContent = '已收藏';
                btn.classList.add('active');
            }
        }
        
        if (charId) {
            const index = this.favorites.characters.findIndex(f => f.id === charId);
            if (index > -1) {
                await this.storage.removeFavorite('character', charId);
                this.favorites.characters.splice(index, 1);
                btn.textContent = '收藏';
                btn.classList.remove('active');
            } else {
                await this.storage.addFavorite('character', charId);
                this.favorites.characters.push({ id: charId, timestamp: Date.now() });
                btn.textContent = '已收藏';
                btn.classList.add('active');
            }
        }
    },
    
    saveFavorites() {
        this.storage.save('timeline_favorites', this.favorites);
    },
    
    loadFavorites() {
        const saved = this.storage.load('timeline_favorites');
        if (saved) {
            this.favorites = saved;
        }
    },
    
    async loadFavoritesFromServer() {
        if (!this.isLoggedIn) {
            return;
        }
        
        try {
            this.showLoading('正在加载收藏...');
            const favorites = await Promise.race([
                this.storage.getFavorites(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('加载收藏超时')), 5000))
            ]);
            
            this.favorites = {
                events: (favorites.events || []).map(id => ({ id, timestamp: Date.now() })),
                characters: (favorites.characters || []).map(id => ({ id, timestamp: Date.now() })),
                years: favorites.years || []
            };
            
            this.saveFavorites();
            this.renderTimeline();
        } catch (error) {
            console.error('加载收藏失败:', error);
            alert('加载收藏失败，请稍后重试');
        } finally {
            this.hideLoading();
        }
    }
};

function handleCustomAvatar(input) {
    TimelineApp.handleCustomAvatar(input);
}

function selectSettingsAvatar(avatarType) {
    TimelineApp.selectSettingsAvatar(avatarType);
}

function showCharacterFromFavorites(charId) {
    TimelineApp.showCharacterFromFavorites(charId);
}

document.addEventListener('DOMContentLoaded', async () => {
    await TimelineApp.init();
    TimelineApp.checkLoginStateAndInit().catch(error => {
        console.error('登录状态检查失败:', error);
    });
});
