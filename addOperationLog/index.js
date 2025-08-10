Page({
  data: {
    name: '一路继电器带光耦隔离', // 默认名称
    stock: 1,
    operator: '' // 操作员姓名
  },
  
  onLoad(options) {
    // 强制使用统一名称
    this.setData({
      name: '一路继电器带光耦隔离'
    });
    
    // 从扫码页面获取操作员信息
    if (options.operator) {
      const operator = decodeURIComponent(options.operator);
      this.setData({ operator });
    } else {
      // 尝试从本地存储获取
      const savedOperator = wx.getStorageSync('currentOperator') || '';
      this.setData({ operator: savedOperator });
    }
  },
  
  addModule() {
    const { name, stock, operator } = this.data;
    
    // 确保有操作员信息
    if (!operator) {
      wx.showToast({
        title: '请先设置操作员',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '添加中...' });
    
    wx.cloud.callFunction({
      name: 'addNewModule',
      data: {
        name: '一路继电器带光耦隔离', // 强制使用统一名称
        current_stock: stock,
        module_id: '一路继电器带光耦隔离', // 强制使用统一ID
        operator: operator // 添加操作员信息
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.result.errCode === 0) {
          wx.showToast({ title: '添加成功', icon: 'success' });
          
          // 保存操作员到本地存储
          wx.setStorageSync('currentOperator', operator);
          
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({
            title: `添加失败: ${res.result.errMsg}`,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: `请求失败: ${err.errMsg}`,
          icon: 'none'
        });
      }
    });
  }
});