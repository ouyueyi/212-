// cloudfunctions/getModuleInfo/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event) => {
  const db = cloud.database()
  const { moduleId } = event
  
  try {
    const res = await db.collection('modules')
      .where({
        module_id: moduleId
      })
      .get()
    
    // 返回前端期望的格式
    return {
      errCode: 0,
      errMsg: 'success',
      data: res.data
    }
  } catch (err) {
    return {
      errCode: 500,
      errMsg: '数据库查询失败',
      detail: err.message
    }
  }
}