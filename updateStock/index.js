// cloudfunctions/updateStock/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event) => {
  const db = cloud.database()
  const { moduleId, newStock } = event
  
  console.log('更新库存参数:', event);
  
  try {
    // 使用正确的字段名更新
    const res = await db.collection('modules')
      .where({
        module_id: moduleId
      })
      .update({
        data: {
          current_stock: newStock,
          updated_at: new Date()
        }
      })
    
    console.log('数据库更新结果:', res);
    
    // 返回更新后的文档
    const updatedDoc = await db.collection('modules')
      .where({ module_id: moduleId })
      .get()
    
    return {
      errCode: 0,
      errMsg: '更新成功',
      data: updatedDoc.data[0]
    }
  } catch (err) {
    console.error('库存更新失败:', err);
    return {
      errCode: 500,
      errMsg: '库存更新失败',
      detail: err.message
    }
  }
}