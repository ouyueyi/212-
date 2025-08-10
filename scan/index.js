Page({
  data: {
    operatorName: '',
    isProcessing: false,
    operatorHistory: []
  },
  
  onLoad() {
    // 尝试从本地存储获取操作员
    const savedOperator = wx.getStorageSync('currentOperator') || '';
    this.setData({ operatorName: savedOperator });
    
    // 加载历史操作员
    this.loadOperatorHistory();
  },
  
  // 加载历史操作员
  loadOperatorHistory() {
    const history = wx.getStorageSync('operatorHistory') || [];
    this.setData({ operatorHistory: history });
  },
  
  // 输入操作员姓名
  inputOperatorName(e) {
    this.setData({ operatorName: e.detail.value });
  },
  
  // 选择历史操作员
  selectOperator(e) {
    const name = e.currentTarget.dataset.name;
    this.setData({ operatorName: name });
  },
  
  // 扫码功能
  scanCode() {
    if (this.data.isProcessing) return;
    this.setData({ isProcessing: true });
    
    const { operatorName } = this.data;
    
    if (!operatorName) {
      wx.showToast({
        title: '请先输入姓名',
        icon: 'none'
      });
      this.setData({ isProcessing: false });
      return;
    }
    
    // 保存操作员
    wx.setStorageSync('currentOperator', operatorName);
    this.saveOperatorToHistory(operatorName);
    
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: (res) => {
        const moduleId = res.result;
        console.log('扫描结果:', moduleId);
        
        // 验证扫描结果
        if (!moduleId || typeof moduleId !== 'string') {
          wx.showToast({
            title: '无效的二维码',
            icon: 'none'
          });
          this.setData({ isProcessing: false });
          return;
        }
        
        this.callGetModuleInfo(moduleId, operatorName);
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
        this.setData({ isProcessing: false });
      }
    });
  },
  
  // 保存操作员到历史记录
  saveOperatorToHistory(name) {
    let history = wx.getStorageSync('operatorHistory') || [];
    
    // 移除重复项
    history = history.filter(item => item !== name);
    
    // 添加到开头
    history.unshift(name);
    
    // 限制最多5条
    if (history.length > 5) {
      history = history.slice(0, 5);
    }
    
    wx.setStorageSync('operatorHistory', history);
    this.setData({ operatorHistory: history });
  },
  
  // 调用云函数获取模块信息
  async callGetModuleInfo(moduleId, operatorName) {
    try {
      console.log('开始调用云函数 getModuleInfo');
      
      const res = await wx.cloud.callFunction({
        name: 'getModuleInfo',
        data: { moduleId }
      });
      
      console.log('云函数返回:', res);
      
      // 检查错误代码
      if (res.result.errCode) {
        if (res.result.errCode === 404) {
          // 模块未找到
          wx.showModal({
            title: '模块未注册',
            content: `ID: ${moduleId} 未在系统中注册`,
            confirmText: '立即添加',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.navigateTo({
                  url: `/pages/add-module/index?moduleId=${moduleId}&operator=${encodeURIComponent(operatorName)}`
                });
              }
            }
          });
          return;
        }
        throw new Error(`${res.result.errMsg} (${res.result.errCode})`);
      }
      
      // 检查数据格式
      if (!res.result.data || res.result.data.length === 0) {
        throw new Error('返回数据为空');
      }
      
      const module = res.result.data[0];
      const encodedModule = encodeURIComponent(JSON.stringify(module));
      
      wx.navigateTo({
        url: `/pages/operation/index?module=${encodedModule}&operator=${encodeURIComponent(operatorName)}`
      });
    } catch (err) {
      console.error('获取模块信息失败:', err);
      wx.showToast({
        title: `获取模块信息失败: ${err.message || err.errMsg}`,
        icon: 'none',
        duration: 3000
      });
    } finally {
      this.setData({ isProcessing: false });
    }
  }
});