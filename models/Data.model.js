const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
   data : [
    {
        name : {
            type:String,
             unique: true,
        },
        run : {
            type:Number
        }
    }
   ]
});

module.exports = mongoose.model('Data', dataSchema);
