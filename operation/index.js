Page({
  data: {
    module: null,
    operation: 'in',
    quantity: 1,
    currentStock: 0,
    isProcessing: false,
    operator: '',
    loading: true
  },
  
  onLoad(options) {
    console.log('操作页面参数:', options);
    
    // 获取操作员
    if (options.operator) {
      this.setData({
        operator: decodeURIComponent(options.operator)
      });
    }
    
    // 获取模块数据
    if (options.module) {
      try {
        const module = JSON.parse(decodeURIComponent(options.module));
        console.log('解析后的模块数据:', module);
        
        // 确保所有字段都有默认值
        const safeModule = {
          module_id: module.module_id || '未知ID',
          name: module.name || '未知名称',
          type: module.type || '未知类型',
          current_stock: module.current_stock || 0,
          location: module.location || '未设置位置',
          updated_at: module.updated_at || new Date().toISOString(),
          min_stock: module.min_stock || 0,
          specs: module.specs || {}
        };
        
        this.setData({
          module: safeModule,
          currentStock: safeModule.current_stock,
          loading: false
        });
      } catch (e) {
        console.error('解析模块数据失败:', e);
        this.setData({ loading: false });
        wx.showToast({
          title: '数据格式错误',
          icon: 'error',
          duration: 3000
        });
      }
    } else {
      this.setData({ loading: false });
      wx.showToast({
        title: '未接收到模块数据',
        icon: 'error',
        duration: 3000
      });
    }
  },
  
  // 日期格式化函数
  formatDate(dateString) {
    if (!dateString) return '未知';
    
    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
      return '格式错误';
    }
  },
  
  // 选择操作类型
  selectOperation(e) {
    this.setData({ operation: e.currentTarget.dataset.op });
  },
  
  // 输入数量
  inputQuantity(e) {
    this.setData({ quantity: parseInt(e.detail.value) || 0 });
  },
  
  // 提交操作
  async submitOperation() {
    if (this.data.isProcessing) return;
    this.setData({ isProcessing: true });
    
    const { module, operation, quantity, currentStock } = this.data;
    
    // 验证模块数据
    if (!module) {
      wx.showToast({ title: '模块信息缺失', icon: 'none' });
      this.setData({ isProcessing: false });
      return;
    }
    
    // 验证数量
    if (quantity <= 0) {
      wx.showToast({ title: '数量必须大于0', icon: 'none' });
      this.setData({ isProcessing: false });
      return;
    }
    
    // 计算新库存
    const newStock = operation === 'in' ? 
      currentStock + quantity : 
      currentStock - quantity;
    
    // 出库检查
    if (operation === 'out' && newStock < 0) {
      wx.showToast({ title: '库存不足', icon: 'none' });
      this.setData({ isProcessing: false });
      return;
    }
    
    wx.showLoading({ title: '处理中...', mask: true });
    
    try {
      console.log('调用 updateStock 云函数...');
      const updateRes = await wx.cloud.callFunction({
        name: 'updateStock',
        data: {
          moduleId: module.module_id,
          newStock
        }
      });
      
      console.log('updateStock 返回:', updateRes);
      
      if (updateRes.result.errCode) {
        throw new Error(updateRes.result.errMsg);
      }
      
      // 更新UI
      this.setData({
        currentStock: newStock,
        'module.current_stock': newStock,
        'module.updated_at': new Date().toISOString()
      }, () => {
        console.log('UI更新后的数据:', this.data);
      });
      
      console.log('调用 addOperationLog 云函数...');
      try {
        await wx.cloud.callFunction({
          name: 'addOperationLog',
          data: {
            moduleId: module.module_id,
            moduleName: module.name,
            operationType: operation,
            quantity,
            operator: this.data.operator || '未知操作员'
          }
        });
      } catch (logErr) {
        console.error('日志记录失败:', logErr);
        // 本地保存日志
        const logs = wx.getStorageSync('localLogs') || [];
        logs.push({
          moduleId: module.module_id,
          moduleName: module.name,
          operationType: operation,
          quantity,
          operator: this.data.operator || '未知操作员',
          timestamp: new Date().toISOString()
        });
        wx.setStorageSync('localLogs', logs);
      }
      
      wx.showToast({ title: '操作成功', icon: 'success' });
    } catch (err) {
      console.error('操作失败:', err);
      wx.showToast({
        title: `操作失败: ${err.message || err.errMsg}`,
        icon: 'none',
        duration: 3000
      });
    } finally {
      wx.hideLoading();
      this.setData({ isProcessing: false });
    }
  },
  
  // 查看操作记录
  viewLogs() {
    wx.navigateTo({
      url: '/pages/logs/index'
    });
  }
});