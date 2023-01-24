const mongoose=require('mongoose');
const schema=require('../schemas/users')

//User（首字母大写单数→集合小写复数） users
module.exports=mongoose.model('User', schema);