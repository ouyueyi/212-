Page({
  data: {
    name: '一路继电器带光耦隔离', // 默认名称
    stock: 1
  },
  
  onLoad(options) {
    // 强制使用统一名称
    this.setData({
      name: '一路继电器带光耦隔离'
    });
  },
  
  addModule() {
    const { name, stock } = this.data;
    
    wx.cloud.callFunction({
      name: 'addNewModule',
      data: {
        name: '一路继电器带光耦隔离', // 强制使用统一名称
        current_stock: stock,
        module_id: '一路继电器带光耦隔离' // 强制使用统一ID
      },
      success: () => {
        wx.showToast({ title: '添加成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      },
      fail: () => {
        wx.showToast({ title: '添加失败', icon: 'error' });
      }
    });
  }
});