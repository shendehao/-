// API配置文件
(function() {
  'use strict';

  // ========== 配置项 ==========
  const CONFIG = {
    // API基础URL
    API_BASE_URL: 'http://localhost:8000/api',
    
    // 是否使用模拟数据（true=模拟数据，false=真实API）
    USE_MOCK_DATA: true,
    
    // Token存储键名
    TOKEN_KEY: 'auth_token',
    
    // 请求超时时间（毫秒）
    REQUEST_TIMEOUT: 10000,
    
    // 是否显示调试日志
    DEBUG: true
  };

  // ========== 工具函数 ==========
  
  // 获取Token
  function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY) || 
           localStorage.getItem('access_token') || '';
  }

  // 设置Token
  function setToken(token) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem('access_token', token);
  }

  // 清除Token
  function clearToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem('access_token');
  }

  // 日志输出
  function log(type, ...args) {
    if (!CONFIG.DEBUG) return;
    
    const styles = {
      info: 'color: #007AFF; font-weight: bold',
      success: 'color: #34C759; font-weight: bold',
      warning: 'color: #FF9500; font-weight: bold',
      error: 'color: #FF3B30; font-weight: bold'
    };
    
    const icons = {
      info: '📘',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(`%c${icons[type]} ${args[0]}`, styles[type], ...args.slice(1));
  }

  // ========== API请求封装 ==========
  
  async function request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const token = getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const requestOptions = {
      ...options,
      headers
    };

    log('info', `API请求: ${options.method || 'GET'} ${endpoint}`);

    try {
      // 创建超时Promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), CONFIG.REQUEST_TIMEOUT);
      });

      // 创建请求Promise
      const fetchPromise = fetch(url, requestOptions);

      // 竞速
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      log('success', `API响应成功:`, data);
      return { success: true, data };
      
    } catch (error) {
      log('error', `API请求失败: ${error.message}`);
      
      if (CONFIG.USE_MOCK_DATA) {
        log('warning', '使用模拟数据');
        return { success: true, data: null, isMock: true };
      }
      
      return { success: false, error: error.message };
    }
  }

  // GET请求
  async function get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(url, { method: 'GET' });
  }

  // POST请求
  async function post(endpoint, data = {}) {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT请求
  async function put(endpoint, data = {}) {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // PATCH请求
  async function patch(endpoint, data = {}) {
    return request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // DELETE请求
  async function del(endpoint) {
    return request(endpoint, { method: 'DELETE' });
  }

  // ========== 导出到全局 ==========
  
  window.ApiConfig = {
    // 配置
    config: CONFIG,
    
    // Token管理
    getToken,
    setToken,
    clearToken,
    
    // 日志
    log,
    
    // HTTP方法
    get,
    post,
    put,
    patch,
    delete: del,
    request,
    
    // 切换模式
    useMockData: (use = true) => {
      CONFIG.USE_MOCK_DATA = use;
      log('info', `数据模式切换为: ${use ? '模拟数据' : '真实API'}`);
    },
    
    // 切换调试模式
    setDebug: (debug = true) => {
      CONFIG.DEBUG = debug;
      log('info', `调试模式: ${debug ? '开启' : '关闭'}`);
    }
  };

  // 初始化日志
  log('info', '🚀 API配置已加载');
  log('info', `📡 API地址: ${CONFIG.API_BASE_URL}`);
  log('info', `📊 数据模式: ${CONFIG.USE_MOCK_DATA ? '模拟数据' : '真实API'}`);
  log('info', `🔐 Token: ${getToken() ? '已设置' : '未设置'}`);

})();
