
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Postagem = new Schema({
    titular:{
        type: String,
        default: "Unknown"
    },
    title: {
        
        type: String,
        required: true
    },
    slug:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    content:{
        type: String,
        required: true,
    },
    category:{
        type: Schema.Types.ObjectId, //armazenar o id de um objecto
        ref: "categorias", //referência para o tipo. É a tabela/model de Category
        required: true
    },
    date:{
        type: Date,
        default: Date.now()
    }

})

mongoose.model("postagens", Postagem);