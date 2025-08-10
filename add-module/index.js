Page({
  data: {
    moduleId: '', // 扫描到的模块ID
    name: '一路继电器带光耦隔离', // 默认名称
    stock: 1, // 初始库存
    location: '', // 存放位置
    minStock: 0, // 最小库存预警值
    operator: '', // 操作员
    isProcessing: false // 防止重复提交
  },
  
  onLoad(options) {
    // 从扫码页面获取参数
    if (options.moduleId) {
      this.setData({
        moduleId: decodeURIComponent(options.moduleId)
      });
    }
    
    if (options.operator) {
      this.setData({
        operator: decodeURIComponent(options.operator)
      });
    } else {
      // 尝试从本地存储获取操作员
      const savedOperator = wx.getStorageSync('currentOperator') || '';
      this.setData({ operator: savedOperator });
    }
    
    // 设置默认位置
    this.setData({ location: 'A-1柜' });
  },
  
  // 输入名称
  inputName(e) {
    this.setData({ name: e.detail.value });
  },
  
  // 输入库存
  inputStock(e) {
    this.setData({ stock: parseInt(e.detail.value) || 0 });
  },
  
  // 输入位置
  inputLocation(e) {
    this.setData({ location: e.detail.value });
  },
  
  // 输入最小库存
  inputMinStock(e) {
    this.setData({ minStock: parseInt(e.detail.value) || 0 });
  },
  
  // 添加模块
  addModule() {
    if (this.data.isProcessing) return;
    this.setData({ isProcessing: true });
    
    const { moduleId, name, stock, location, minStock, operator } = this.data;
    
    // 验证输入
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      this.setData({ isProcessing: false });
      return;
    }
    
    if (stock < 0) {
      wx.showToast({ title: '库存不能为负', icon: 'none' });
      this.setData({ isProcessing: false });
      return;
    }
    
    wx.showLoading({ title: '添加中...', mask: true });
    
    // 调用云函数添加模块
    wx.cloud.callFunction({
      name: 'addNewModule',
      data: {
        moduleId: moduleId || name, // 如果没有扫描ID，使用名称作为ID
        name: name,
        current_stock: stock,
        location: location,
        min_stock: minStock,
        operator: operator || '未知操作员'
      },
      success: (res) => {
        wx.hideLoading();
        this.setData({ isProcessing: false });
        
        if (res.result.errCode === 0) {
          wx.showToast({ title: '添加成功', icon: 'success' });
          
          // 保存操作员到本地存储
          wx.setStorageSync('currentOperator', operator);
          
          // 延迟返回
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: `添加失败: ${res.result.errMsg}`,
            icon: 'none',
            duration: 3000
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ isProcessing: false });
        wx.showToast({
          title: `请求失败: ${err.errMsg}`,
          icon: 'none',
          duration: 3000
        });
      }
    });
  }
});