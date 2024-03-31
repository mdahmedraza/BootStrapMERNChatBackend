const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=>{
    console.log("db connected....")
}).catch((err)=>{
    console.log("not connected....")
})
