const TimelineApp = {
    events: [],
    characters: [],
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
    
    // DOM元素缓存
    domCache: {},
    
    // 初始化应用
    init() {
        this.cacheDOMElements();
        this.loadEvents();
        this.loadCharacters();
        this.renderTimeline();
        this.setupEventListeners();
        this.loadFavorites();
    },
    
    // 缓存DOM元素
    cacheDOMElements() {
        this.domCache = {
            timeline: document.getElementById('timeline'),
            searchInput: document.getElementById('searchInput'),
            categoryFilter: document.getElementById('categoryFilter'),
            zoomLevel: document.getElementById('zoomLevel'),
            loginBtn: document.getElementById('loginBtn'),
            userMenu: document.getElementById('userMenu'),
            characterModal: document.getElementById('characterModal'),
            characterInfo: document.getElementById('characterInfo'),
            loginModal: document.getElementById('loginModal'),
            registerModal: document.getElementById('registerModal'),
            accountSettingsModal: document.getElementById('accountSettingsModal'),
            noResults: document.getElementById('noResults'),
            countdownText: document.getElementById('countdownText'),
            timelineContainer: document.querySelector('.timeline-container')
        };
    },

    // 加载历史事件数据
    loadEvents() {
        // 检查 historicalEvents 是否已定义
        if (typeof historicalEvents !== 'undefined') {
            this.events = historicalEvents; // 将数据赋值给 events 属性
        }
    },

    // 加载人物档案数据
    loadCharacters() {
        // 检查 historicalCharacters 是否已定义
        if (typeof historicalCharacters !== 'undefined') {
            this.characters = historicalCharacters; // 将数据赋值给 characters 属性
        }
    },

    // 存储管理模块：封装localStorage和API操作
    storage: {
        // API基础URL - 自动检测环境
        apiBaseUrl: (() => {
            const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'http://localhost:3000/api';
            } else {
                return 'https://timeline-app-one.vercel.app/api';
            }
        })(),
        
        // 缓存机制
        cache: {
            data: new Map(),
            timestamps: new Map(),
            ttl: 60000 // 1分钟缓存
        },
        
        // 获取缓存数据
        getCache(key) {
            const cached = this.cache.data.get(key);
            if (cached && Date.now() - this.cache.timestamps.get(key) < this.cache.ttl) {
                return cached;
            }
            return null;
        },
        
        // 设置缓存数据
        setCache(key, value) {
            this.cache.data.set(key, value);
            this.cache.timestamps.set(key, Date.now());
        },
        
        // 清除缓存
        clearCache() {
            this.cache.data.clear();
            this.cache.timestamps.clear();
        },
        
        // 获取认证令牌
        getToken() {
            return localStorage.getItem('timeline_token');
        },
        
        // 设置认证令牌
        setToken(token) {
            localStorage.setItem('timeline_token', token);
        },
        
        // 清除认证令牌
        clearToken() {
            localStorage.removeItem('timeline_token');
        },
        
        // API请求封装
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
            
            // 添加超时机制，10秒超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                    ...options,
                    headers: { ...headers, ...options.headers },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || '请求失败');
                }
                
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
        
        // 用户注册
        async register(username, password, email, avatar) {
            return this.apiRequest('/register', {
                method: 'POST',
                body: JSON.stringify({ username, password, email, avatar })
            });
        },
        
        // 用户登录
        async login(username, password) {
            // 使用与 apiRequest 相同的超时机制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || '请求失败');
                }
                
                if (data.token) {
                    this.setToken(data.token);
                }
                
                return data;
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw new Error('登录超时，请检查网络连接或稍后重试');
                }
                throw error;
            }
        },
        
        // 获取用户信息
        async getUser() {
            return this.apiRequest('/user', {
                method: 'GET'
            });
        },
        
        // 更新用户信息
        async updateUser(userData) {
            return this.apiRequest('/user', {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        },
        
        // 获取收藏内容
        async getFavorites() {
            return this.apiRequest('/favorites', {
                method: 'GET'
            });
        },
        
        // 添加收藏
        async addFavorite(type, id) {
            return this.apiRequest('/favorites', {
                method: 'POST',
                body: JSON.stringify({ type, id })
            });
        },
        
        // 删除收藏
        async removeFavorite(type, id) {
            return this.apiRequest('/favorites', {
                method: 'DELETE',
                body: JSON.stringify({ type, id })
            });
        },
        
        // 保存数据到localStorage（兼容旧代码）
        save(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('保存数据失败:', e);
                return false;
            }
        },
        
        // 从localStorage读取数据（兼容旧代码）
        load(key) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : null;
            } catch (e) {
                console.error('读取数据失败:', e);
                return null;
            }
        },
        
        // 删除localStorage中的数据（兼容旧代码）
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('删除数据失败:', e);
                return false;
            }
        },
        
        // 清空所有localStorage数据（兼容旧代码）
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

    // 渲染时间轴
    renderTimeline() {
        const timeline = this.domCache.timeline;
        const timelineLine = timeline.querySelector('.timeline-line');
        
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
        
        let globalIndex = 0;
        const yearPositions = {};
        const yearHeights = {};
        
        const sortedYears = Object.keys(eventsByYear).sort((a, b) => this.parseYear(a) - this.parseYear(b));
        
        const eventSpacing = 150;
        const yearToEventSpacing = 50;
        const yearSpacing = 150;
        const zoomFactor = this.zoomLevel / 100;
        
        let currentTop = 80;
        
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
            timeline.appendChild(yearMarker);
            
            yearPositions[year] = currentTop;
            
            yearEvents.forEach((event, eventIndex) => {
                const eventElement = this.createEventElement(event, eventIndex, currentTop + yearToEventSpacing, zoomFactor, eventSpacing);
                timeline.appendChild(eventElement);
            });
            
            currentTop += yearToEventSpacing + yearEvents.length * eventSpacing + yearSpacing;
            globalIndex++;
        });
        
        this.yearPositions = yearPositions;
        this.updateTimelineHeight();
    },

    // 更新页面文本
    updatePageText() {
    },

    // 清除搜索
    clearSearch() {
        this.domCache.searchInput.value = '';
        this.domCache.categoryFilter.value = 'all';
        this.renderTimeline();
    },

    // 高亮搜索词
    highlightSearchText(text, searchTerm) {
        if (!searchTerm || !text) return text; // 如果没有搜索词或文本，直接返回
        
        const regex = new RegExp(`(${searchTerm})`, 'gi'); // 创建正则表达式，不区分大小写
        return text.replace(regex, '<span class="search-highlight">$1</span>'); // 替换为高亮标签
    },

    // 将文本中的人物名称转换为可点击链接
    linkCharactersInText(text, searchTerm) {
        if (!text || !this.characters || this.characters.length === 0) return text; // 如果没有文本或人物数据，直接返回
        
        let result = text; // 初始化结果
        const placeholders = []; // 占位符数组
        let placeholderIndex = 0; // 占位符索引
        
        // 按名称长度降序排序，避免短名称匹配长名称的一部分
        const sortedCharacters = [...this.characters].sort((a, b) => b.name.length - a.name.length);
        
        // 遍历所有人物
        sortedCharacters.forEach(character => {
            // 创建正则表达式，匹配人物名称
            const regex = new RegExp(`(${character.name})`, 'g');
            // 替换为可点击链接
            result = result.replace(regex, `<span class="character-link" data-char-id="${character.id}">$1</span>`);
        });
        
        // 如果有搜索词，应用搜索高亮
        if (searchTerm) {
            // 保护人物链接，替换为占位符
            result = result.replace(/<span class="character-link" data-char-id="([^"]+)">([^<]*)<\/span>/g, (match, charId, charName) => {
                const placeholder = `__PLACEHOLDER_${placeholderIndex}__`;
                placeholders.push({ placeholder, charId, charName });
                placeholderIndex++;
                return placeholder;
            });
            
            // 在其他文本中应用搜索高亮
            result = result.replace(new RegExp(`(${searchTerm})`, 'gi'), '<span class="search-highlight">$1</span>');
            
            // 恢复人物链接，并应用搜索高亮
            placeholders.forEach(({ placeholder, charId, charName }) => {
                const highlightedName = charName.replace(new RegExp(`(${searchTerm})`, 'gi'), '<span class="search-highlight">$1</span>');
                result = result.replace(placeholder, `<span class="character-link" data-char-id="${charId}">${highlightedName}</span>`);
            });
        }
        
        return result; // 返回处理后的文本
    },

    // 创建事件元素
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

    // 创建年份标注元素
    createYearMarker(event, currentTop, zoomFactor) {
        const yearMarker = document.createElement('div');
        yearMarker.className = 'timeline-year-marker';
        yearMarker.textContent = event.year;
        yearMarker.dataset.yearOffset = currentTop;
        
        const topPosition = currentTop * zoomFactor;
        
        yearMarker.style.top = `${topPosition}px`;
        yearMarker.style.transform = 'translateX(-50%)';
        
        return yearMarker;
    },

    // 更新时间轴高度
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

    // 解析年份字符串为数字
    parseYear(yearStr) {
        // 如果是公元前年份，返回负数
        if (yearStr.includes('公元前')) {
            return -parseInt(yearStr.replace('公元前', '').replace('年', ''));
        }
        // 否则返回正数
        return parseInt(yearStr.replace('年', ''));
    },

    // 获取分类标签
    getCategoryLabel(category) {
        // 分类标签映射表
        const labels = {
            'political': '政治',
            'cultural': '文化',
            'technology': '科技',
            'military': '军事'
        };
        // 返回对应的标签，如果没有则返回原值
        return labels[category] || category;
    },

    // 筛选事件
    filterEvents() {
        const categoryFilter = this.domCache.categoryFilter.value;
        const searchInput = this.domCache.searchInput.value.toLowerCase();
        
        return this.events.filter(event => {
            const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
            const matchesSearch = !searchInput || 
                event.title.toLowerCase().includes(searchInput) ||
                event.description.toLowerCase().includes(searchInput) ||
                (event.characters && event.characters.some(char => 
                    char.name.toLowerCase().includes(searchInput)
                ));
            return matchesCategory && matchesSearch;
        });
    },

    // 设置事件监听器
    setupEventListeners() {
        // 分类筛选器变化时重新渲染时间轴
        document.getElementById('categoryFilter').addEventListener('change', () => this.renderTimeline());
        
        // 搜索按钮点击事件：执行搜索
        document.getElementById('searchBtn').addEventListener('click', () => this.renderTimeline());
        // 搜索输入框回车键事件：执行搜索
        document.getElementById('searchInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { // 检测回车键
                this.renderTimeline(); // 执行搜索
            }
        });
        
        // 缩放按钮点击事件
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        
        // 登录按钮点击事件
        document.getElementById('loginBtn').addEventListener('click', (e) => {
            if (this.isLoggedIn) {
                // 如果已登录，点击头像显示/隐藏用户菜单
                e.stopPropagation();
                this.toggleUserMenu();
            } else {
                // 如果未登录，显示登录弹窗
                this.showLoginModal();
            }
        });
        
        // 用户菜单项点击事件
        document.getElementById('accountSettings').addEventListener('click', () => this.showAccountSettings());
        document.getElementById('switchAccount').addEventListener('click', () => this.switchAccount());
        document.getElementById('viewFavorites').addEventListener('click', () => this.showFavoritesList());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // 点击其他地方隐藏用户菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#loginBtn') && !e.target.closest('#userMenu')) {
                this.hideUserMenu();
            }
        });
        
        // 人物弹窗关闭按钮点击事件
        document.getElementById('modalClose').addEventListener('click', () => this.hideCharacterModal());
        // 人物弹窗遮罩层点击事件
        document.getElementById('modalOverlay').addEventListener('click', () => this.hideCharacterModal());
        
        // 登录弹窗关闭按钮点击事件
        document.getElementById('loginClose').addEventListener('click', () => this.hideLoginModal());
        // 登录弹窗遮罩层点击事件
        document.getElementById('loginOverlay').addEventListener('click', () => this.hideLoginModal());
        // 登录表单提交事件
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        // 注册按钮点击事件
        document.getElementById('showRegisterBtn').addEventListener('click', () => this.showRegisterModal());
        
        // 注册弹窗关闭按钮点击事件
        document.getElementById('registerClose').addEventListener('click', () => this.hideRegisterModal());
        // 注册弹窗遮罩层点击事件
        document.getElementById('registerOverlay').addEventListener('click', () => this.hideRegisterModal());
        // 注册表单提交事件
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        
        // 账号设置弹窗关闭按钮点击事件
        document.getElementById('accountSettingsClose').addEventListener('click', () => this.hideAccountSettings());
        // 账号设置弹窗遮罩层点击事件
        document.getElementById('accountSettingsOverlay').addEventListener('click', () => this.hideAccountSettings());
        // 账号设置表单提交事件
        document.getElementById('accountSettingsForm').addEventListener('submit', (e) => this.handleAccountSettings(e));
        
        // 全局点击事件委托
        document.addEventListener('click', (e) => {
            // 点击事件卡片时显示收藏和分享按钮
            const eventCard = e.target.closest('.event-card');
            if (eventCard) {
                // 隐藏所有事件的操作按钮
                document.querySelectorAll('.event-actions').forEach(actions => {
                    actions.classList.remove('visible');
                });
                // 显示当前事件卡片的操作按钮
                const eventActions = eventCard.querySelector('.event-actions');
                if (eventActions) {
                    eventActions.classList.add('visible');
                }
            }
            
            // 点击人物链接时显示人物档案弹窗
            const characterLink = e.target.closest('.character-link');
            if (characterLink) {
                e.preventDefault();
                e.stopPropagation();
                const charId = characterLink.dataset.charId;
                this.showCharacterModal(charId);
            }
            
            // 点击收藏按钮时切换收藏状态
            if (e.target.classList.contains('favorite-btn')) {
                this.toggleFavorite(e.target);
            }
            
            // 点击其他地方隐藏所有操作按钮
            if (!e.target.closest('.event-card') && !e.target.closest('.modal-content')) {
                document.querySelectorAll('.event-actions').forEach(actions => {
                    actions.classList.remove('visible');
                });
            }
        });
        
        // 窗口大小改变时更新时间轴高度
        window.addEventListener('resize', () => this.updateTimelineHeight());
    },

    // 处理鼠标滚轮缩放（已禁用，改为使用按钮缩放）
    handleWheelZoom(e) {
        // 不再使用滚轮缩放，恢复为正常的页面滚动
    },

    // 放大时间轴
    zoomIn() {
        if (this.zoomLevel < 150) { // 最大缩放150%
            this.zoomLevel += 10; // 每次缩放10%
            this.updateZoom(); // 更新缩放
        }
    },

    // 缩小时间轴
    zoomOut() {
        if (this.zoomLevel > 80) { // 最小缩放80%
            this.zoomLevel -= 10; // 每次缩放10%
            this.updateZoom(); // 更新缩放
        }
    },

    // 更新缩放
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

    // 显示登录弹窗
    showLoginModal() {
        this.isShowingFavorites = false;
        this.isShowingCharacterFromFavorites = false;
        if (!this.isLoggedIn) {
            this.domCache.loginModal.classList.add('active');
        }
    },

    // 隐藏登录弹窗
    hideLoginModal() {
        this.domCache.loginModal.classList.remove('active');
    },

    // 显示注册弹窗
    showRegisterModal() {
        this.hideLoginModal();
        this.domCache.registerModal.classList.add('active');
    },

    // 隐藏注册弹窗
    hideRegisterModal() {
        this.domCache.registerModal.classList.remove('active');
    },

    // 处理登录
    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            alert('请输入用户名和密码');
            return;
        }
        
        try {
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
            }
        } catch (error) {
            console.error('登录失败:', error);
            const errorMessage = error.message || '登录失败，请重试';
            alert(errorMessage);
        }
    },

    // 退出登录
    logout() {
        console.log('logout 被调用');
        this.isLoggedIn = false; // 设置登录状态为 false
        this.currentUser = null; // 清空当前用户
        this.storage.clearToken(); // 清除认证令牌
        this.isShowingFavorites = false; // 重置收藏列表标记
        this.isShowingCharacterFromFavorites = false; // 重置从收藏列表打开的人物档案标记
        console.log('已清除token，准备更新显示');
        this.updateUserDisplay(); // 更新用户显示
        this.hideUserMenu(); // 隐藏用户菜单
        console.log('logout 完成');
    },

    // 处理注册
    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const avatar = document.getElementById('registerAvatar').value;
        
        // 验证用户名
        if (!username || username.length > 16) {
            alert('用户名不能为空且最多16个字符');
            return;
        }
        
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            alert('请输入正确的邮箱格式');
            return;
        }
        
        // 验证密码长度
        if (password.length < 8 || password.length > 16) {
            alert('密码长度必须在8-16位之间');
            return;
        }
        
        // 验证密码必须包含大小写字母
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        if (!hasUpperCase || !hasLowerCase) {
            alert('密码必须包含至少一位大写字母和一位小写字母');
            return;
        }
        
        // 验证确认密码
        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        
        try {
            const data = await this.storage.register(username, password, email, avatar);
            
            if (data.user) {
                alert('注册成功！请登录');
                this.hideRegisterModal();
                this.showLoginModal();
            }
        } catch (error) {
            alert(error.message || '注册失败，请重试');
        }
    },

    // 选择头像
    selectAvatar(avatarType) {
        document.getElementById('registerAvatar').value = avatarType;
        
        document.querySelectorAll('#registerModal .avatar-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`#registerModal .avatar-option[data-avatar="${avatarType}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    },

    // 选择账号设置头像
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

    // 处理自定义头像
    handleCustomAvatar(input) {
        const file = input.files[0];
        if (!file) return;
        
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }
        
        // 验证文件大小（限制为 2MB）
        if (file.size > 2 * 1024 * 1024) {
            alert('图片大小不能超过 2MB');
            return;
        }
        
        // 读取文件并转换为 base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result;
            
            // 更新头像值为 base64 数据
            document.getElementById('settingsAvatar').value = base64Data;
            
            // 更新选中状态
            document.querySelectorAll('#accountSettingsModal .avatar-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            const customOption = document.querySelector(`#accountSettingsModal .avatar-option[data-avatar="custom"]`);
            if (customOption) {
                customOption.classList.add('selected');
                
                // 更新自定义头像预览
                const preview = customOption.querySelector('.avatar-preview');
                if (preview) {
                    preview.innerHTML = `<img src="${base64Data}" alt="自定义头像" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                }
            }
        };
        reader.readAsDataURL(file);
    },

    // 更换账户
    switchAccount() {
        this.hideUserMenu();
        this.logout();
        this.showLoginModal();
    },

    // 保存登录状态
    saveLoginState(username) {
        this.storage.save('timeline_user', { username, loginTime: new Date().toISOString() }); // 使用存储模块保存用户数据
    },

    // 检查登录状态
    async checkLoginState() {
        const token = this.storage.getToken(); // 检查是否有令牌
        if (token) { // 如果存在令牌
            try {
                const user = await this.storage.getUser(); // 获取用户信息
                this.isLoggedIn = true; // 设置登录状态为 true
                this.currentUser = user; // 保存当前用户信息
                this.updateUserDisplay(); // 更新用户显示
                this.loadFavoritesFromServer(); // 从服务器加载收藏
            } catch (error) {
                console.error('检查登录状态错误:', error);
                this.storage.clearToken(); // 清除无效令牌
            }
        }
    },

    // 更新用户显示
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

    // 生成用户头像（缓存优化）
    generateAvatar(avatarType) {
        if (!avatarType) avatarType = 'blue';
        
        // 如果是自定义头像（base64 数据）
        if (avatarType.startsWith('data:image/')) {
            return `<img src="${avatarType}" alt="自定义头像" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
        
        const avatars = {
            blue: '<div class="avatar-initial blue-smile">😊</div>',
            yellow: '<div class="avatar-initial yellow-smile">😊</div>',
            green: '<div class="avatar-initial green-smile">😊</div>'
        };
        
        return avatars[avatarType] || avatars.blue;
    },

    // 显示用户菜单（缓存DOM元素）
    showUserMenu() {
        if (!this.userMenuElement) {
            this.userMenuElement = this.domCache.userMenu;
        }
        if (this.userMenuElement) {
            this.userMenuElement.classList.add('active');
        }
    },

    // 隐藏用户菜单（缓存DOM元素）
    hideUserMenu() {
        if (!this.userMenuElement) {
            this.userMenuElement = this.domCache.userMenu;
        }
        if (this.userMenuElement) {
            this.userMenuElement.classList.remove('active');
        }
    },

    // 切换用户菜单显示状态（缓存DOM元素）
    toggleUserMenu() {
        if (!this.userMenuElement) {
            this.userMenuElement = this.domCache.userMenu;
        }
        if (this.userMenuElement) {
            this.userMenuElement.classList.toggle('active');
        }
    },

    // 显示账号设置
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

    // 隐藏账号设置
    hideAccountSettings() {
        this.domCache.accountSettingsModal.classList.remove('active');
    },

    // 处理账号设置保存
    async handleAccountSettings(e) {
        e.preventDefault();
        
        const email = document.getElementById('settingsEmail').value;
        const newPassword = document.getElementById('settingsNewPassword').value;
        const confirmPassword = document.getElementById('settingsConfirmPassword').value;
        
        if (newPassword && newPassword !== confirmPassword) {
            alert('两次输入的密码不一致');
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
                
                alert('账号设置保存成功！');
            } else {
                alert('请输入要修改的信息');
            }
            
            this.hideAccountSettings();
        } catch (error) {
            alert('保存失败：' + (error.message || '未知错误'));
        }
    },

    // 显示收藏列表
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

    // 切换收藏操作按钮显示
    toggleFavoriteActions(element) {
        const actionsDiv = element.nextElementSibling;
        if (actionsDiv && actionsDiv.classList.contains('favorite-actions')) {
            actionsDiv.style.display = actionsDiv.style.display === 'none' ? 'flex' : 'none';
        }
    },

    // 从收藏列表显示人物档案
    showCharacterFromFavorites(charId) {
        this.isShowingCharacterFromFavorites = true;
        this.showCharacterModal(charId);
    },

    // 初始化拖拽排序
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
        
        // 监听拖拽结束，保存排序
        const modal = document.getElementById('characterModal');
        modal.addEventListener('dragend', () => {
            this.saveFavoritesOrder();
        });
    },

    // 保存收藏排序
    async saveFavoritesOrder() {
        try {
            const eventItems = document.querySelectorAll('.favorites-list:first-of-type .favorite-item');
            const characterItems = document.querySelectorAll('.favorites-list:last-of-type .favorite-item');
            
            // 更新事件排序
            this.favorites.events = [...eventItems].map((item, index) => {
                const existing = this.favorites.events.find(f => f.id === item.dataset.id);
                return existing ? { ...existing, customOrder: index } : null;
            }).filter(Boolean);
            
            // 更新人物排序
            this.favorites.characters = [...characterItems].map((item, index) => {
                const existing = this.favorites.characters.find(f => f.id === item.dataset.id);
                return existing ? { ...existing, customOrder: index } : null;
            }).filter(Boolean);
            
            console.log('收藏排序已更新');
        } catch (error) {
            console.error('保存收藏排序失败:', error);
        }
    },

    // 取消收藏
    async unfavoriteItem(type, id) {
        if (!confirm('确定要取消收藏吗？')) {
            return;
        }
        
        try {
            await this.storage.removeFavorite(type, id);
            
            // 从本地收藏列表中移除
            if (type === 'event') {
                this.favorites.events = this.favorites.events.filter(f => f.id !== id);
            } else if (type === 'character') {
                this.favorites.characters = this.favorites.characters.filter(f => f.id !== id);
            }
            
            // 重新渲染
            this.showFavoritesList();
            this.renderTimeline(); // 更新时间轴上的收藏状态
        } catch (error) {
            console.error('取消收藏失败:', error);
            alert('保存失败：' + (error.message || '未知错误'));
        }
    },

    // 从服务器加载收藏
    async loadFavoritesFromServer() {
        try {
            const favorites = await this.storage.getFavorites(); // 从服务器获取收藏
            
            // 转换为带时间戳的格式
            this.favorites = {
                events: (favorites.events || []).map(id => ({ id, timestamp: Date.now() })),
                characters: (favorites.characters || []).map(id => ({ id, timestamp: Date.now() })),
                years: favorites.years || []
            };
            
            this.renderTimeline(); // 重新渲染时间轴
        } catch (error) {
            console.error('加载收藏失败:', error);
        }
    },

    // 显示人物档案弹窗
    showCharacterModal(charId) {
        const character = this.characters.find(c => c.id === charId);
        if (!character) return;
        
        const characterInfo = this.domCache.characterInfo;
        const isFavorited = this.favorites.characters.some(f => f.id === character.id);
        
        characterInfo.innerHTML = `
            <h2>${character.name}</h2>
            <div class="character-title">${character.title}</div>
            <div class="character-dates">${character.birth} - ${character.death}</div>
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

    // 隐藏人物档案弹窗
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

    // 切换收藏状态
    async toggleFavorite(btn) {
        const eventId = btn.dataset.eventId; // 获取事件ID
        const charId = btn.dataset.charId; // 获取人物ID
        
        if (eventId) { // 如果是事件收藏
            const index = this.favorites.events.findIndex(f => f.id === eventId); // 查找事件在收藏数组中的索引
            if (index > -1) { // 如果已收藏
                await this.storage.removeFavorite('event', eventId); // 调用后端API删除收藏
                this.favorites.events.splice(index, 1); // 从收藏数组中移除
                btn.textContent = '收藏'; // 更新按钮文字
                btn.classList.remove('active'); // 移除 active 类
            } else { // 如果未收藏
                await this.storage.addFavorite('event', eventId); // 调用后端API添加收藏
                this.favorites.events.push({ id: eventId, timestamp: Date.now() }); // 添加到收藏数组
                btn.textContent = '已收藏'; // 更新按钮文字
                btn.classList.add('active'); // 添加 active 类
            }
        }
        
        if (charId) { // 如果是人物收藏
            const index = this.favorites.characters.findIndex(f => f.id === charId); // 查找人物在收藏数组中的索引
            if (index > -1) { // 如果已收藏
                await this.storage.removeFavorite('character', charId); // 调用后端API删除收藏
                this.favorites.characters.splice(index, 1); // 从收藏数组中移除
                btn.textContent = '收藏'; // 更新按钮文字
                btn.classList.remove('active'); // 移除 active 类
            } else { // 如果未收藏
                await this.storage.addFavorite('character', charId); // 调用后端API添加收藏
                this.favorites.characters.push({ id: charId, timestamp: Date.now() }); // 添加到收藏数组
                btn.textContent = '已收藏'; // 更新按钮文字
                btn.classList.add('active'); // 添加 active 类
            }
        }
    },

    // 保存收藏数据
    saveFavorites() {
        this.storage.save('timeline_favorites', this.favorites); // 使用存储模块保存收藏数据
    },

    // 加载收藏数据
    loadFavorites() {
        const saved = this.storage.load('timeline_favorites'); // 使用存储模块获取收藏数据
        if (saved) { // 如果存在收藏数据
            this.favorites = saved; // 直接赋值给 favorites 属性
        }
    }
};

// 将函数暴露到全局作用域，以便 HTML 中的事件处理器可以调用
function handleCustomAvatar(input) {
    TimelineApp.handleCustomAvatar(input);
}

function selectSettingsAvatar(avatarType) {
    TimelineApp.selectSettingsAvatar(avatarType);
}

function selectAvatar(avatarType) {
    TimelineApp.selectAvatar(avatarType);
}

function showCharacterFromFavorites(charId) {
    TimelineApp.showCharacterFromFavorites(charId);
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    TimelineApp.init(); // 初始化应用
    TimelineApp.checkLoginState(); // 检查登录状态
});
