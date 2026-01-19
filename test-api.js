const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('🚀 开始测试 API 端点...\n');

    let authToken = null;
    let userId = null;

    try {
        // 测试 1: 用户注册
        console.log('📝 测试 1: 用户注册');
        const registerResponse = await axios.post(`${BASE_URL}/api/register`, {
            username: 'testuser',
            password: 'Test1234',
            email: 'test@example.com',
            avatar: 'blue'
        });
        console.log('✅ 注册成功:', registerResponse.data);
        userId = registerResponse.data.user.id;
        console.log('');

        // 测试 2: 用户登录
        console.log('🔐 测试 2: 用户登录');
        const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
            username: 'testuser',
            password: 'Test1234'
        });
        console.log('✅ 登录成功:', loginResponse.data);
        authToken = loginResponse.data.token;
        console.log('');

        // 测试 3: 获取用户信息
        console.log('👤 测试 3: 获取用户信息');
        const userResponse = await axios.get(`${BASE_URL}/api/user`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ 获取用户信息成功:', userResponse.data);
        console.log('');

        // 测试 4: 更新用户信息
        console.log('✏️  测试 4: 更新用户信息');
        const updateResponse = await axios.put(`${BASE_URL}/api/user`, {
            email: 'updated@example.com',
            avatar: 'red'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ 更新用户信息成功:', updateResponse.data);
        console.log('');

        // 测试 5: 获取收藏列表
        console.log('⭐ 测试 5: 获取收藏列表');
        const favoritesResponse = await axios.get(`${BASE_URL}/api/favorites`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ 获取收藏列表成功:', favoritesResponse.data);
        console.log('');

        // 测试 6: 添加收藏
        console.log('➕ 测试 6: 添加收藏');
        const addFavoriteResponse = await axios.post(`${BASE_URL}/api/favorites`, {
            type: 'event',
            id: 'event_001'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ 添加收藏成功:', addFavoriteResponse.data);
        console.log('');

        // 测试 7: 再次获取收藏列表
        console.log('⭐ 测试 7: 再次获取收藏列表');
        const favoritesResponse2 = await axios.get(`${BASE_URL}/api/favorites`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ 获取收藏列表成功:', favoritesResponse2.data);
        console.log('');

        // 测试 8: 删除收藏
        console.log('➖ 测试 8: 删除收藏');
        const deleteFavoriteResponse = await axios.delete(`${BASE_URL}/api/favorites`, {
            data: { type: 'event', id: 'event_001' },
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ 删除收藏成功:', deleteFavoriteResponse.data);
        console.log('');

        // 测试 9: 最终获取收藏列表
        console.log('⭐ 测试 9: 最终获取收藏列表');
        const favoritesResponse3 = await axios.get(`${BASE_URL}/api/favorites`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ 获取收藏列表成功:', favoritesResponse3.data);
        console.log('');

        console.log('🎉 所有 API 测试通过！');

    } catch (error) {
        console.error('❌ 测试失败:', error.response ? error.response.data : error.message);
        if (error.response) {
            console.error('状态码:', error.response.status);
        }
    }
}

testAPI();
